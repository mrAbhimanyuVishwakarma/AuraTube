import os
import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
import stripe
import razorpay
from dotenv import load_dotenv

from app.database import get_db
from app.models import User, Transaction
from app.auth import get_current_user

load_dotenv()

# API Keys from env
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_51...")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_...")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "price_...")

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_...")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "secret_...")

# Initialize Razorpay Client if keys are configured
razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    try:
        razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except Exception as rz_err:
        print(f"Error initializing Razorpay: {rz_err}")

router = APIRouter(prefix="/api/billing", tags=["billing"])

@router.post("/stripe/create-checkout")
def create_stripe_checkout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Creates a Stripe Checkout Session for International Cards + PayPal."""
    if not stripe.api_key or stripe.api_key.startswith("sk_test_51..."):
        raise HTTPException(
            status_code=400, 
            detail="Stripe credentials are not configured on the server. Please check environment variables."
        )

    try:
        # Redirect back to the frontend page after payment
        domain = os.getenv("FRONTEND_URL", "http://localhost:5173")
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card", "paypal"] if os.getenv("STRIPE_PAYPAL_ENABLED") == "true" else ["card"],
            line_items=[
                {
                    "price": STRIPE_PRICE_ID,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            client_reference_id=user.id,
            success_url=f"{domain}?payment=success",
            cancel_url=f"{domain}?payment=cancel",
        )
        return {"session_url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Stripe webhook to handle asynchronous payment success events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        transaction_id = session.get("id")
        amount = session.get("amount_total", 0) / 100.0
        currency = session.get("currency", "usd")

        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_premium = True
                user.premium_expiry = datetime.datetime.utcnow() + datetime.timedelta(days=30)
                
                # Log transaction
                transaction = Transaction(
                    id=transaction_id,
                    user_id=user.id,
                    gateway="stripe",
                    amount=amount,
                    currency=currency,
                    status="completed"
                )
                db.add(transaction)
                db.commit()

    return {"status": "success"}

@router.post("/razorpay/create-order")
def create_razorpay_order(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Creates a Razorpay Order for UPI & Indian Cards."""
    if not razorpay_client:
        raise HTTPException(
            status_code=400, 
            detail="Razorpay credentials are not configured on the server. Please check environment variables."
        )

    try:
        # Amount in paise: ₹199 INR = 19900 paise
        amount_paise = 19900 
        data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"receipt_{user.id[:8]}_{int(datetime.datetime.utcnow().timestamp())}",
            "notes": {
                "user_id": user.id,
                "user_email": user.email
            }
        }
        order = razorpay_client.order.create(data=data)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": RAZORPAY_KEY_ID
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/razorpay/verify")
def verify_razorpay_payment(
    req: dict, # Receives payment_id, order_id, signature
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Verifies signature of completed Razorpay payment and upgrades user."""
    if not razorpay_client:
        raise HTTPException(status_code=400, detail="Razorpay is not configured.")

    try:
        # Verify the signature
        params_dict = {
            'razorpay_order_id': req.get('razorpay_order_id'),
            'razorpay_payment_id': req.get('razorpay_payment_id'),
            'razorpay_signature': req.get('razorpay_signature')
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # If signature is correct, upgrade user
        user.is_premium = True
        user.premium_expiry = datetime.datetime.utcnow() + datetime.timedelta(days=30)
        
        # Log Transaction
        transaction = Transaction(
            id=req.get('razorpay_payment_id'),
            user_id=user.id,
            gateway="razorpay",
            amount=199.00,
            currency="INR",
            status="completed"
        )
        db.add(transaction)
        db.commit()
        
        return {"status": "success", "message": "User upgraded successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")
