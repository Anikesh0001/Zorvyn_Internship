from marshmallow import Schema, fields, validate

class UserSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1))
    email = fields.Email(required=True)
    password = fields.String(load_only=True, required=True, validate=validate.Length(min=6))
    role = fields.String(validate=validate.OneOf(['viewer', 'analyst', 'admin']))
    is_active = fields.Boolean()
    created_at = fields.DateTime(dump_only=True)

class UserUpdateSchema(Schema):
    role = fields.String(validate=validate.OneOf(['viewer', 'analyst', 'admin']))
    is_active = fields.Boolean()
