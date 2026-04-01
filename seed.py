import random
from datetime import datetime
from dateutil.relativedelta import relativedelta
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.transaction import Transaction

def seed_data():
    app = create_app('development')
    with app.app_context():
        # Drop and recreate tables
        db.drop_all()
        db.create_all()

        print("Creating users...")
        admin = User(name="Admin User", email="admin@ledgr.dev", role="admin")
        admin.set_password("Admin@123")
        
        analyst = User(name="Analyst User", email="analyst@ledgr.dev", role="analyst")
        analyst.set_password("Analyst@123")
        
        viewer = User(name="Viewer User", email="viewer@ledgr.dev", role="viewer")
        viewer.set_password("Viewer@123")

        db.session.add_all([admin, analyst, viewer])
        db.session.commit()

        print("Users created.")
        
        print("Creating 50 random transactions...")
        categories_income = ["Salary", "Revenue", "Consulting"]
        categories_expense = ["Operations", "Marketing", "Utilities", "Travel", "Misc"]

        today = datetime.today().date()
        six_months_ago = today - relativedelta(months=6)

        transactions = []
        for i in range(50):
            t_type = random.choice(["income", "expense"])
            
            # Generate random date in last 6 months
            random_days = random.randint(0, (today - six_months_ago).days)
            t_date = six_months_ago + relativedelta(days=random_days)

            if t_type == "income":
                category = random.choice(categories_income)
                amount = round(random.uniform(50000, 500000), 2)
            else:
                category = random.choice(categories_expense)
                amount = round(random.uniform(5000, 80000), 2)

            txn = Transaction(
                amount=amount,
                type=t_type,
                category=category,
                date=t_date,
                notes=f"Random {t_type} generated for {category}",
                created_by=admin.id
            )
            transactions.append(txn)

        db.session.add_all(transactions)
        db.session.commit()
        print(f"Successfully created 50 transactions.")

if __name__ == "__main__":
    seed_data()
