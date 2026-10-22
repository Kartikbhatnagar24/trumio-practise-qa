import json
import random
import sys
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.core.variant import DEFAULT_VARIANT
from app.services.money import RATES_TO_INR, to_inr_paise, to_minor
from app.static.enums import Category, ClaimStatus, Currency

PASSWORD = 'Claimly@2026'
TODAY = date(2026, 6, 15)
FIRST_NAMES = [
    'Aarav',
    'Ishita',
    'Rohan',
    'Meera',
    'Karan',
    'Ananya',
    'Siddharth',
    'Pooja',
    'Arjun',
    'Divya',
    'Nikhil',
    'Sneha',
    'Varun',
    'Kavya',
    'Aditya',
    'Riya',
    'Manish',
    'Priya',
    'Harsh',
    'Tanvi',
    'Yash',
    'Nandini',
    'Sahil',
    'Shreya',
    'Abhishek',
    'Lakshmi',
    'Gaurav',
    'Pallavi',
    'Kunal',
    'Swati',
    'Deepak',
    'Aisha',
    'Farhan',
    'Joseph',
    'Mehul',
    'Ritika',
    'Suresh',
    'Anjali',
    'Vivek',
    'Zoya',
    'Tarun',
    'Neel',
]
LAST_NAMES = ['Sharma', 'Iyer', 'Kapoor', 'Reddy', 'Banerjee', 'Menon', 'Joshi', 'Pillai', 'Gupta', 'Desai', 'Khan', 'Fernandes', 'Kulkarni', 'Chatterjee', 'Bhat', 'Saxena', 'Naidu', 'Malhotra']
DEPARTMENTS = ['Engineering', 'Sales', 'Delivery', 'Finance', 'People', 'Operations']
PROJECTS = [
    ('p-atlas', 'PRJ-ATLAS', 'Atlas Payments Migration', 1),
    ('p-harbor', 'PRJ-HARBOR', 'Harbor Logistics Portal', 1),
    ('p-legacy', 'PRJ-LEGACY', 'Legacy CRM Support', 0),
    ('p-nimbus', 'PRJ-NIMBUS', 'Nimbus Cloud Cost Review', 1),
    ('p-orchid', 'PRJ-ORCHID', 'Orchid Retail Analytics', 1),
    ('p-sentinel', 'PRJ-SENTINEL', 'Sentinel Fraud Monitoring', 1),
    ('p-lotus', 'PRJ-LOTUS', 'Lotus Insurance Claims Revamp', 1),
    ('p-meridian', 'PRJ-MERIDIAN', 'Meridian HR Self-Service', 1),
    ('p-quartz', 'PRJ-QUARTZ', 'Quartz Data Platform', 1),
    ('p-banyan', 'PRJ-BANYAN', 'Banyan Telecom Billing', 1),
    ('p-cascade', 'PRJ-CASCADE', 'Cascade Mobile Banking App', 1),
    ('p-kestrel', 'PRJ-KESTREL', 'Kestrel Supply Chain Pilot', 1),
    ('p-aurora', 'PRJ-AURORA', 'Aurora Customer Onboarding', 1),
    ('p-ember', 'PRJ-EMBER', 'Ember Archive Decommission', 0),
]
MERCHANTS = {
    Category.HOTEL: [
        ('Taj Lands End', Currency.INR),
        ('ITC Gardenia', Currency.INR),
        ('Lemon Tree Premier', Currency.INR),
        ('Marriott Whitefield', Currency.INR),
        ('Hilton London Paddington', Currency.GBP),
        ('Hotel Adlon Kempinski', Currency.EUR),
    ],
    Category.MEALS: [
        ('Chaayos', Currency.INR),
        ("Haldiram's", Currency.INR),
        ('Barbeque Nation', Currency.INR),
        ('Mainland China', Currency.INR),
        ('Third Wave Coffee', Currency.INR),
        ('Pret A Manger', Currency.GBP),
        ('Shake Shack', Currency.USD),
    ],
    Category.LOCAL_TRANSPORT: [
        ('Uber India', Currency.INR),
        ('Ola Cabs', Currency.INR),
        ('Rapido', Currency.INR),
        ('Namma Metro', Currency.INR),
        ('Transport for London', Currency.GBP),
        ('Yellow Cab NYC', Currency.USD),
    ],
    Category.AIRFARE: [('IndiGo', Currency.INR), ('Air India', Currency.INR), ('Akasa Air', Currency.INR), ('Lufthansa', Currency.EUR), ('Delta Air Lines', Currency.USD)],
    Category.CLIENT_ENTERTAINMENT: [('Indian Accent', Currency.INR), ('Bombay Canteen', Currency.INR), ('Toit Brewpub', Currency.INR), ('The Wolseley', Currency.GBP)],
    Category.OFFICE_SUPPLIES: [('Amazon Business', Currency.INR), ('Croma', Currency.INR), ('Reliance Digital', Currency.INR), ('Staples', Currency.USD)],
}
INR_RANGES = {
    Category.HOTEL: (3000, 6500),
    Category.MEALS: (250, 1600),
    Category.LOCAL_TRANSPORT: (120, 1500),
    Category.AIRFARE: (4500, 28000),
    Category.CLIENT_ENTERTAINMENT: (2500, 14000),
    Category.OFFICE_SUPPLIES: (400, 9000),
}
DESCRIPTIONS = {
    Category.HOTEL: ['Client workshop stay', 'Quarterly planning offsite', 'Onsite deployment support'],
    Category.MEALS: ['Working lunch with the client team', 'Late-night release support dinner', 'Team lunch after sprint review'],
    Category.LOCAL_TRANSPORT: ['Airport drop', 'Client office visit', 'Cab after late shift'],
    Category.AIRFARE: ['Flight for client kickoff', 'Travel to delivery centre', 'Return flight after go-live'],
    Category.CLIENT_ENTERTAINMENT: ['Dinner with client stakeholders', 'Steering committee dinner'],
    Category.OFFICE_SUPPLIES: ['External monitor', 'Noise-cancelling headset', 'Ergonomic keyboard', 'USB-C dock'],
}
STATUS_WEIGHTS = {
    ClaimStatus.DRAFT: 8,
    ClaimStatus.SUBMITTED: 15,
    ClaimStatus.SENT_BACK: 5,
    ClaimStatus.MANAGER_APPROVED: 12,
    ClaimStatus.FINANCE_APPROVED: 5,
    ClaimStatus.PAID: 45,
    ClaimStatus.REJECTED: 10,
}
SEND_BACK_COMMENTS = ['Attach the itemised bill, not the card slip.', 'Tag the right project code.', 'Split the personal part of this bill.']
REJECT_COMMENTS = ['Personal expense, not reimbursable.', 'Already covered by the client.', 'Claimed after the policy window.']
PARTIAL_COMMENTS = ['Alcohol is not reimbursable.', 'Upgrade charges are not covered.', 'Capped at the policy limit.']


def user(user_id, name, role, grade, department, manager_id, rng):
    salt = rng.randbytes(8).hex()
    email = f'{name.lower().replace(" ", ".")}@claimly.in'
    return {
        'id': user_id,
        'name': name,
        'email': email,
        'role': role,
        'grade': grade,
        'department': department,
        'manager_id': manager_id,
        'password_salt': salt,
        'password_hash': hash_password(PASSWORD, salt),
    }


def build_users(rng: random.Random) -> list[dict]:
    fixed = json.loads((Path(__file__).resolve().parents[1] / 'tests' / 'seed_minimal.json').read_text(encoding='utf-8'))['users']
    taken = {entry['name'] for entry in fixed}
    names = [f'{first} {last}' for first in FIRST_NAMES for last in LAST_NAMES]
    rng.shuffle(names)
    names = iter(name for name in names if name not in taken)
    users = list(fixed)
    managers = {'Engineering': ['u-kavita', 'u-rahul']}
    for department in ('Sales', 'Delivery', 'People', 'Operations'):
        manager = user(f'u-m-{department.lower()}', next(names), 'MANAGER', 'G3', department, 'u-kavita', rng)
        users.append(manager)
        managers[department] = [manager['id']]
    users.append(user('u-f-arjun', next(names), 'FINANCE_ADMIN', 'G2', 'Finance', 'u-neha', rng))
    managers['Finance'] = ['u-kavita']
    employee_departments = ['Engineering'] * 12 + ['Sales'] * 7 + ['Delivery'] * 8 + ['Finance'] * 3 + ['People'] * 4 + ['Operations'] * 4
    for index, department in enumerate(employee_departments):
        manager_id = 'u-rahul' if department == 'Engineering' and index % 2 == 0 else rng.choice(managers[department])
        users.append(user(f'u-e-{index + 1:02d}', next(names), 'EMPLOYEE', rng.choice(['G1', 'G1', 'G2', 'G2', 'G3']), department, manager_id, rng))
    return users


def stamp(day: date, rng: random.Random) -> str:
    return datetime.combine(day, time(rng.randint(9, 19), rng.randint(0, 59), rng.randint(0, 59))).isoformat() + '+05:30'


def build_claims(rng: random.Random, users: list[dict]) -> tuple[list[dict], list[dict]]:
    by_id = {entry['id']: entry for entry in users}
    claimants = [entry for entry in users if entry['manager_id'] and entry['role'] != 'FINANCE_ADMIN']
    finance = [entry['id'] for entry in users if entry['role'] == 'FINANCE_ADMIN']
    active_projects = [project[0] for project in PROJECTS if project[3]]
    limit = DEFAULT_VARIANT.rules.manager_approval_limit * 100
    claims, events = [], []
    asha_statuses = [ClaimStatus.DRAFT, ClaimStatus.SUBMITTED, ClaimStatus.SENT_BACK, ClaimStatus.MANAGER_APPROVED, ClaimStatus.PAID, ClaimStatus.PAID, ClaimStatus.REJECTED, ClaimStatus.PAID]
    for index in range(224):
        employee = by_id['u-asha'] if index < len(asha_statuses) else rng.choice(claimants)
        category = rng.choice(list(Category))
        wants_foreign = rng.random() < 0.16
        merchant, currency = rng.choice([entry for entry in MERCHANTS[category] if (entry[1] != Currency.INR) == wants_foreign] or MERCHANTS[category])
        nights = rng.randint(1, 4) if category == Category.HOTEL else None
        low, high = INR_RANGES[category]
        inr = Decimal(rng.randint(low * 100, high * 100)) / 100 * (nights or 1)
        amount = (inr / RATES_TO_INR[currency]).quantize(Decimal('0.01'))
        if index < len(asha_statuses):
            status = asha_statuses[index]
            expense_date = TODAY - timedelta(days=rng.randint(3, 40) if status in (ClaimStatus.DRAFT, ClaimStatus.SUBMITTED, ClaimStatus.SENT_BACK) else rng.randint(20, 150))
        else:
            status = rng.choices(list(STATUS_WEIGHTS), weights=list(STATUS_WEIGHTS.values()))[0]
            expense_date = TODAY - timedelta(days=rng.randint(3, 182))
        if (TODAY - expense_date).days > 60 and status in (ClaimStatus.DRAFT, ClaimStatus.SUBMITTED, ClaimStatus.SENT_BACK):
            status = ClaimStatus.PAID
        amount_inr = to_inr_paise(amount, currency)
        if status == ClaimStatus.FINANCE_APPROVED and amount_inr <= limit:
            status = ClaimStatus.MANAGER_APPROVED
        claim_id = 10001 + index
        receipt = rng.random() < 0.42 or amount_inr >= DEFAULT_VARIANT.rules.receipt_required_from * 100
        created = expense_date + timedelta(days=rng.randint(0, 3))
        claim = {
            'id': claim_id,
            'employee_id': employee['id'],
            'category': category.value,
            'currency': currency.value,
            'amount_minor': to_minor(amount),
            'amount_inr_paise': amount_inr,
            'merchant': merchant,
            'expense_date': expense_date.isoformat(),
            'description': rng.choice(DESCRIPTIONS[category]),
            'project_id': rng.choice(active_projects) if rng.random() < 0.8 else None,
            'nights': nights,
            'status': status.value,
            'approved_amount_inr_paise': None,
            'receipt_filename': f'receipt-{claim_id}.pdf' if receipt else None,
            'receipt_size': rng.randint(40_000, 900_000) if receipt else None,
            'receipt_content_type': 'application/pdf' if receipt else None,
            'created_at': stamp(created, rng),
            'submitted_at': None,
        }
        claims.append(claim)
        if status == ClaimStatus.DRAFT:
            continue
        day = created + timedelta(days=rng.randint(0, 2))
        claim['submitted_at'] = stamp(day, rng)
        manager = employee['manager_id']

        def add(actor, action, from_status, to_status, comment=None, approved=None, after=(1, 4), claim_id=claim_id):
            nonlocal day
            day = min(day + timedelta(days=rng.randint(*after)), TODAY)
            events.append(
                {'claim_id': claim_id, 'actor_id': actor, 'action': action, 'from_status': from_status, 'to_status': to_status, 'comment': comment, 'amount_inr_paise': approved, 'at': stamp(day, rng)}
            )

        events.append(
            {
                'claim_id': claim_id,
                'actor_id': employee['id'],
                'action': 'submit',
                'from_status': 'DRAFT',
                'to_status': 'SUBMITTED',
                'comment': None,
                'amount_inr_paise': None,
                'at': claim['submitted_at'],
            }
        )
        if status == ClaimStatus.SUBMITTED:
            continue
        if status == ClaimStatus.SENT_BACK:
            add(manager, 'send_back', 'SUBMITTED', 'SENT_BACK', rng.choice(SEND_BACK_COMMENTS))
            continue
        if status == ClaimStatus.REJECTED:
            add(manager, 'reject', 'SUBMITTED', 'REJECTED', rng.choice(REJECT_COMMENTS))
            continue
        partial = rng.random() < 0.12
        approved = int(amount_inr * rng.choice([0.8, 0.85, 0.9])) if partial else amount_inr
        claim['approved_amount_inr_paise'] = approved
        if status == ClaimStatus.FINANCE_APPROVED and approved <= limit:
            status = ClaimStatus.MANAGER_APPROVED
            claim['status'] = status.value
        add(manager, 'approve', 'SUBMITTED', 'MANAGER_APPROVED', rng.choice(PARTIAL_COMMENTS) if partial else None, approved)
        if status == ClaimStatus.MANAGER_APPROVED:
            continue
        if approved > limit:
            add(rng.choice(finance), 'approve', 'MANAGER_APPROVED', 'FINANCE_APPROVED', None, approved)
            if status == ClaimStatus.FINANCE_APPROVED:
                continue
        if status == ClaimStatus.PAID:
            add(rng.choice(finance), 'pay', 'FINANCE_APPROVED' if approved > limit else 'MANAGER_APPROVED', 'PAID', None, approved, after=(2, 6))
    return claims, events


def main() -> None:
    rng = random.Random(2026)
    users = build_users(rng)
    claims, events = build_claims(rng, users)
    projects = [{'id': pid, 'code': code, 'name': name, 'active': active} for pid, code, name, active in PROJECTS]
    print(json.dumps({'anchor_date': TODAY.isoformat(), 'users': users, 'projects': projects, 'claims': claims, 'events': events}, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    main()
