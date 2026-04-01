from flask import jsonify

def success_response(data=None, message="Success", status=200):
    return jsonify({
        "data": data,
        "message": message,
        "status": status
    }), status

def error_response(error="An error occurred", code="ERROR", status=400):
    return jsonify({
        "error": error,
        "code": code
    }), status

def validation_error(errors, message="Validation failed", status=422):
    return jsonify({
        "error": message,
        "details": errors,
        "code": "VALIDATION_FAILED"
    }), status

def not_found_error(error="Resource not found", status=404):
    return jsonify({
        "error": error,
        "code": "NOT_FOUND"
    }), status

def unauthorized_error(error="Unauthorized access", status=401):
    return jsonify({
        "error": error,
        "code": "UNAUTHORIZED"
    }), status

def forbidden_error(error="Access forbidden", status=403):
    return jsonify({
        "error": error,
        "code": "FORBIDDEN"
    }), status
