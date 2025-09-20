type PredictInput = {
  routeId?: string;
  horizon?: number;
  scenario?: Record<string, unknown>;
};

export async function predict(input: PredictInput = {}) {
  const res = await fetch(process.env.ML_PREDICT_URL || "/api/ml/predict", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.ML_PROVIDER_TOKEN || ""}` },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return res.json();
}

export async function simulate(input: Record<string, unknown> = {}) {
  const res = await fetch(process.env.ML_SIMULATE_URL || "/api/ml/simulate", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.ML_PROVIDER_TOKEN || ""}` },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return res.json();
}


