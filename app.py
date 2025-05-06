from flask import Flask, render_template, request, jsonify
import pandas as pd



app = Flask(__name__)


# Load datasets from CSV files and handle thousands separators
try:
    air_quality = pd.read_csv("air_quality.csv", thousands=',')
    co2_emissions = pd.read_csv("co2_emissions.csv", thousands=',')
    noise_pollution = pd.read_csv("noise_pollution.csv", thousands=',')
    
    # Helper function to ensure measurement columns are numeric
    def convert_measurements(df):
        for col in df.columns:
            if col not in ["Borough", "Year"]:
                df[col] = pd.to_numeric(df[col].astype(str).str.replace(',', ''), errors='coerce')
        return df
    
    air_quality = convert_measurements(air_quality)
    co2_emissions = convert_measurements(co2_emissions)
    noise_pollution = convert_measurements(noise_pollution)

except FileNotFoundError as e:
    raise RuntimeError(f"Error loading datasets: {e}")

# Define available factors along with their unit and description
factors = {
    "Air Quality": {
        "data": air_quality,
        "unit": "µg/m³",
        "description": "Particulate matter (PM2.5) and nitrogen dioxide (NO₂) levels."
    },
    "CO2 Emissions": {
        "data": co2_emissions,
        "unit": "kt CO₂",
        "description": "Total carbon dioxide emissions per borough per year."
    },
    "Noise Pollution": {
        "data": noise_pollution,
        "unit": "dB",
        "description": "Environmental noise levels measured in decibels (dB)."
    }
}

# Determine dynamic year range based on the datasets
min_year = min(df["Year"].min() for df in [air_quality, co2_emissions, noise_pollution])
max_year = max(df["Year"].max() for df in [air_quality, co2_emissions, noise_pollution])

@app.route('/')

def index():
    boroughs = sorted(air_quality["Borough"].unique())
    print("Boroughs loaded:", boroughs)  # 🔍 DEBUG LINE
    years = list(range(min_year, max_year + 1))
    return render_template("index.html", boroughs=boroughs, years=years, factors=list(factors.keys()))


@app.route('/get_data', methods=['POST'])
def get_data():
    try:
        data = request.json
        borough = data.get('borough')
        factor = data.get('factor')
        year = int(data.get('year'))

        if not borough or not factor or not year:
            return jsonify({"error": "Missing input parameters"}), 400
        if factor not in factors:
            return jsonify({"error": "Invalid factor selected"}), 400

        df = factors[factor]["data"]

        # If "London Total" is selected, aggregate data across all boroughs for that year
        if borough == "London Total":
            temp = df[df["Year"] == year]
            if temp.empty:
                return jsonify({"error": "No data available"}), 404
            # Sum up numeric columns (excluding "Year")
            measurement_cols = [col for col in temp.select_dtypes(include=["number"]).columns if col != "Year"]
            aggregated = {col: temp[col].sum() for col in measurement_cols}
            record = {"Borough": "London Total", "Year": year}
            record.update(aggregated)
            records = [record]
        else:
            filtered = df[(df["Borough"] == borough) & (df["Year"] == year)]
            if filtered.empty:
                return jsonify({"error": "No data available"}), 404
            records = filtered.to_dict(orient="records")

        return jsonify({
            "records": records,
            "unit": factors[factor]["unit"],
            "description": factors[factor]["description"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)