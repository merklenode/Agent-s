export class LocusCredentialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocusCredentialError";
  }
}

export class LocusRetrievalError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "LocusRetrievalError";
  }
}

export class LocusValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocusValidationError";
  }
}
