class HTTPException extends Error {
    status;  // Declare status as a property
    message; // Declare message as a property
  
    constructor(status, message) {
      super(message);
      this.status = status;
      this.message = message;
      this.name = "HTTPException";  // Optional:  For better identification
    }
  }
  
  module.exports = { HTTPException };