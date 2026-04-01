from marshmallow import Schema, fields, validate

def validate_amount(n):
    if n <= 0:
        raise validate.ValidationError("Amount must be greater than 0")

class TransactionSchema(Schema):
    id = fields.String(dump_only=True)
    amount = fields.Float(required=True, validate=validate_amount)
    type = fields.String(required=True, validate=validate.OneOf(['income', 'expense']))
    category = fields.String(required=True)
    date = fields.Date(required=True)
    notes = fields.String(validate=validate.Length(max=500), load_default="")
    created_by = fields.String(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class TransactionUpdateSchema(Schema):
    amount = fields.Float(validate=validate_amount)
    type = fields.String(validate=validate.OneOf(['income', 'expense']))
    category = fields.String()
    date = fields.Date()
    notes = fields.String(validate=validate.Length(max=500))
