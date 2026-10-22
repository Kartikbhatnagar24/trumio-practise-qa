from enum import Enum


class ClaimsPath(str, Enum):
    CLAIMS = 'claims'
    EXPENSES = 'expenses'


class AmountField(str, Enum):
    AMOUNT = 'amount'
    CLAIM_AMOUNT = 'claim_amount'


class MerchantField(str, Enum):
    MERCHANT = 'merchant'
    VENDOR = 'vendor'


class DateField(str, Enum):
    EXPENSE_DATE = 'expense_date'
    SPENT_ON = 'spent_on'


class CategoryPicker(str, Enum):
    SELECT = 'select'
    RADIO = 'radio'
    COMBOBOX = 'combobox'


class DateInput(str, Enum):
    CALENDAR = 'calendar'
    TYPED = 'typed'


class SubmitLabel(str, Enum):
    SUBMIT_CLAIM = 'submit_claim'
    SEND_FOR_APPROVAL = 'send_for_approval'


class ColumnOrder(str, Enum):
    DATE_FIRST = 'date_first'
    AMOUNT_FIRST = 'amount_first'


class StepOrder(str, Enum):
    DETAILS_FIRST = 'details_first'
    RECEIPT_FIRST = 'receipt_first'


class Role(str, Enum):
    EMPLOYEE = 'EMPLOYEE'
    MANAGER = 'MANAGER'
    FINANCE_ADMIN = 'FINANCE_ADMIN'


class Grade(str, Enum):
    G1 = 'G1'
    G2 = 'G2'
    G3 = 'G3'
