from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import io
import base64
import numpy as np

app = FastAPI()

# CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.read_csv("./students-exam-scores.csv")

# manupulation
df.columns = df.columns.str.strip()
df.replace("", np.nan, inplace=True)
df["EthnicGroup"] = df["EthnicGroup"].str.extract(r"group\s*([A-E])", expand=False)
df["TestPrep"] = df["TestPrep"].str.strip().map({"completed": True, "none": False})
df["IsFirstChild"] = df["IsFirstChild"].str.strip().map({"yes": True, "no": False})
df["WklyStudyHours"] = df["WklyStudyHours"].astype(str).str.extract(r"(\d+)", expand=False).fillna("0").astype(int)
df["AvgScore"] = df[["MathScore", "ReadingScore", "WritingScore"]].mean(axis=1)
numeric_cols = df.select_dtypes(include=['number']).columns
df[numeric_cols] = df[numeric_cols].fillna(0)

# schema
class CompareRequest(BaseModel):
    score: str
    factor: str
    chart_type: str 

@app.post("/compare")
async def compare_scores(req: CompareRequest):
    score_col = req.score
    factor_col = req.factor
    chart_type = req.chart_type.lower()

    if score_col not in df.columns or factor_col not in df.columns:
        return {"error": "Invalid columns"}

    try:
        summary = df.groupby(factor_col)[score_col].describe().to_dict()
    except Exception:
        return {"error": "Cannot generate summary for selected columns"}

    sns.set(style="whitegrid")
    plt.figure(figsize=(8, 5))

    try:
        if chart_type == "violin":
            sns.violinplot(x=factor_col, y=score_col, data=df)
        elif chart_type == "box":
            sns.boxplot(x=factor_col, y=score_col, data=df)
        elif chart_type == "bar":
            means = df.groupby(factor_col)[score_col].mean().reset_index()
            sns.barplot(x=factor_col, y=score_col, data=means)
        elif chart_type == "swarm":
            sns.swarmplot(x=factor_col, y=score_col, data=df)
        else:
            return {"error": "Unsupported chart type"}
    except Exception as e:
        return {"error": f"Plotting error: {str(e)}"}

    plt.title(f"{score_col} by {factor_col} ({chart_type} plot)")
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close()

    return {"summary": summary, "image": encoded}
