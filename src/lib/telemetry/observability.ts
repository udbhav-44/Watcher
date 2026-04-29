type MetricPayload = {
  name: string;
  value: number;
  unit: "ms" | "count" | "ratio";
  metadata?: Record<string, string | number | boolean>;
};

export const recordMetric = (payload: MetricPayload): void => {
  if (process.env.NODE_ENV === "development") {
    console.info("[metric]", payload.name, payload.value, payload.unit, payload.metadata ?? {});
  }
};
