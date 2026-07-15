export interface NormalizationDiagnostics {
  status: "ok" | "degraded" | "invalid";
  missingRequiredFields: string[];
  invalidFields: Array<{ path: string; receivedType: string; reason: string }>;
  inferredFields: Array<{ path: string; sourcePaths: string[]; rule: string }>;
  defaultedFields: Array<{ path: string; defaultValue: unknown; reason: string }>;
  unknownFields: string[];
  warnings: string[];
}

export class DiagnosticsBuilder {
  private readonly value: NormalizationDiagnostics = {
    status: "ok",
    missingRequiredFields: [],
    invalidFields: [],
    inferredFields: [],
    defaultedFields: [],
    unknownFields: [],
    warnings: []
  };

  missing(path: string): void {
    this.value.missingRequiredFields.push(path);
    this.value.status = "invalid";
  }

  invalid(path: string, received: unknown, reason: string): void {
    this.value.invalidFields.push({ path, receivedType: describeType(received), reason });
    this.value.status = "invalid";
  }

  infer(path: string, sourcePaths: string[], rule: string): void {
    this.value.inferredFields.push({ path, sourcePaths, rule });
    if (this.value.status === "ok") this.value.status = "degraded";
  }

  default(path: string, defaultValue: unknown, reason: string): void {
    this.value.defaultedFields.push({ path, defaultValue, reason });
    if (this.value.status === "ok") this.value.status = "degraded";
  }

  unknown(path: string): void {
    this.value.unknownFields.push(path);
  }

  warn(message: string): void {
    this.value.warnings.push(message);
    if (this.value.status === "ok") this.value.status = "degraded";
  }

  build(): NormalizationDiagnostics {
    return {
      ...this.value,
      missingRequiredFields: unique(this.value.missingRequiredFields),
      unknownFields: unique(this.value.unknownFields),
      warnings: unique(this.value.warnings)
    };
  }
}

function describeType(value: unknown): string {
  return value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
