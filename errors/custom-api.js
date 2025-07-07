class CustomAPIError extends Error {
  constructor(message) {
    super(message);
  }
}

class ForeignKeyError extends CustomAPIError {
  constructor(entityName, referencedBy) {
    const message = `Cannot delete this ${entityName} because it is still referenced by ${referencedBy}. Please remove these references first.`;
    super(message);
    this.statusCode = 409; // Conflict
    this.name = 'ForeignKeyError';
  }
}

export { CustomAPIError as default, ForeignKeyError };
