# 📈 Indian Market Intelligence System

**A scalable, real-time market intelligence and quantitative signal generation platform designed to monitor Indian stock market discussions, analyze social sentiment, detect spam, and transform textual market data into actionable trading signals.**

---

# 🎯 Overview

| Aspect                  | Details                              |
| ----------------------- | ------------------------------------ |
| **Architecture**        | Producer-Consumer Data Pipeline      |
| **Language**            | Python 3.9+                          |
| **Data Collection**     | Selenium + Undetected ChromeDriver   |
| **Text Processing**     | Unicode Normalization + NLP          |
| **Deduplication**       | Exact Hashing + 64-bit SimHash / LSH |
| **Storage**             | Snappy-Compressed Apache Parquet     |
| **Signal Generation**   | Sentiment + TF-IDF + Volume Velocity |
| **Analytics**           | Bootstrap Confidence Intervals       |
| **Visualization**       | Matplotlib + Reservoir Sampling      |
| **Big Data Processing** | PyArrow                              |
| **Deployment Ready**    | Modular & Scalable Architecture      |

---

# ⚙️ Local Development

## Prerequisites

* Python 3.9+
* Google Chrome
* pip
* Git

---

## Installation

Clone the repository and navigate to the project directory:

```bash
git clone <your-repo-url>

cd market-intel-system
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment.

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

---

# 🔐 Configure Environment Variables

Create a configuration file according to your environment.

Example:

```env
# Scraper Configuration
TARGET_COUNT=1000
WORKERS=1

# Rate Limiting
RATE_LIMIT=10

# Storage
DATA_DIR=data/processed
OUTPUT_DIR=output/plots
```

> Authentication and scraper configuration can be customized according to the deployment environment.

---

# 🚀 Run the Application

The complete pipeline is orchestrated through `main.py`.

The system follows a **Producer-Consumer architecture**, separating I/O-bound data collection from CPU-bound processing.

---

## 🌐 Live Data Collection

Run the scraper against Indian stock market hashtags:

```bash
python main.py \
  --hashtags "#nifty50" "#sensex" "#intraday" "#banknifty" \
  --target-count 1000 \
  --workers 1
```

The system launches Chrome and begins collecting market-related discussions.

If authentication is required, the scraper supports manual authentication before continuing the collection process.

> Using `--workers 1` is recommended for manual authentication workflows.

---

## 🧪 Mock Data Mode

For testing, development, and CI/CD environments, use the built-in synthetic data generator:

```bash
python main.py \
  --mock \
  --hashtags "#nifty50" "#sensex" "#intraday" "#banknifty" \
  --target-count 1200 \
  --workers 4
```

Mock mode allows you to test:

* Data collection pipeline
* Text normalization
* Spam detection
* SimHash deduplication
* Parquet storage
* Sentiment analysis
* Signal generation
* Visualization

without depending on live social-media data.

---

# ✨ Key Features

* 📡 Real-Time Indian Market Discussion Monitoring
* 🛡️ Resilient Selenium-Based Data Collection
* 🚦 Token Bucket Rate Limiting
* 🔄 Graceful Mock Data Fallback
* ⚡ O(1) Exact Hash Deduplication
* 🧠 64-bit SimHash / LSH Near-Duplicate Detection
* 🧹 Unicode Text Cleaning & Normalization
* 📦 Snappy-Compressed Parquet Storage
* 📅 Date-Partitioned Data Architecture
* 📊 TF-IDF Keyword Momentum Analysis
* 💭 Lexicon-Based Sentiment Analysis
* 📈 Volume Velocity Detection
* 🧮 Composite Quantitative Trading Signals
* 📐 Bootstrap Confidence Intervals
* 💾 Memory-Efficient Data Processing
* 🌊 Streaming Dataset Visualization
* 📉 Reservoir Sampling for Large Datasets
* 🚀 Scalable Producer-Consumer Architecture

---

# 🧠 Market Intelligence Pipeline

The system processes market discussions through multiple stages.

```text
                    ┌──────────────────────┐
                    │   Social Media Data  │
                    │  #NIFTY50 #SENSEX    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Data Collection    │
                    │ Selenium + RateLimit │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Text Processing      │
                    │ Cleaning & Normalize  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Spam Deduplication   │
                    │ Hash + SimHash / LSH │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Optimized Storage     │
                    │ Parquet + Snappy     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Signal Engine        │
                    │ Sentiment + TF-IDF   │
                    │ + Volume Velocity    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Quantitative Signal  │
                    │ + Confidence Interval│
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Visualization &      │
                    │ Market Analytics     │
                    └──────────────────────┘
```

---

# 🛡️ Data Collection Engine

The collection layer is designed to remain resilient under real-world scraping conditions.

### Features

* Selenium-based browser automation
* Undetected ChromeDriver integration
* Token Bucket rate limiter
* Configurable worker architecture
* Login-wall handling
* Manual authentication support
* Synthetic data fallback
* Producer-Consumer queue architecture

### Rate Limiting

The `TokenBucketRateLimiter` controls request frequency and helps prevent excessive requests.

```text
Producer
   │
   ├── Rate Limiter
   │
   ├── Selenium
   │
   └── Raw Posts
          │
          ▼
       Queue
          │
          ▼
     Consumers
```

---

# 🧹 Text Processing Engine

Raw market discussions are normalized before further analysis.

### Processing Pipeline

```text
Raw Text
   │
   ├── Unicode Normalization
   ├── Whitespace Cleanup
   ├── Noise Removal
   ├── Text Normalization
   └── Standardized Output
```

This ensures that similar text representations can be identified efficiently during deduplication and NLP processing.

---

# 🧠 Deduplication Engine

The system uses a two-stage deduplication strategy.

## Exact Duplicate Detection

Exact hashes provide approximately **O(1)** lookup performance for identical content.

```text
Text
 │
 ▼
Hash
 │
 ├── Exists → Duplicate
 │
 └── New → Continue
```

---

## Near-Duplicate Detection

For slightly modified spam or repeated posts, the system uses **64-bit SimHash** with Locality-Sensitive Hashing concepts.

Example:

```text
"BUY NIFTY NOW 🚀"

"BUY NIFTY NOW 🚀🚀"

"BUY NIFTY NOW!!!"
```

Although these texts are not identical, SimHash can identify their similarity and prevent repeated spam from distorting market signals.

---

# 📦 Data Storage

Processed data is stored using **Apache Parquet** with Snappy compression.

### Partitioning Strategy

```text
data/
└── processed/
    ├── date=2026-08-01/
    │   └── data.parquet
    │
    ├── date=2026-08-02/
    │   └── data.parquet
    │
    └── date=2026-08-03/
        └── data.parquet
```

### Advantages

* Columnar storage
* Efficient compression
* Fast analytical queries
* Date-based partition pruning
* Reduced memory consumption
* Suitable for large datasets
* Efficient integration with PyArrow

---

# 📊 Signal Generation Engine

The signal engine converts textual market discussions into quantitative indicators.

## Sentiment Analysis

A lexicon-based sentiment model evaluates market discussions and generates sentiment scores.

```text
Positive Discussion
        │
        ▼
  Positive Score

Negative Discussion
        │
        ▼
  Negative Score
```

---

## TF-IDF Keyword Momentum

TF-IDF is used to identify keywords gaining importance within the collected market discussions.

Example:

```text
NIFTY
BANKNIFTY
BREAKOUT
SUPPORT
RESISTANCE
BULLISH
BEARISH
```

The system can track changes in keyword relevance over time.

---

## Volume Velocity

The system monitors the rate at which market-related discussions are increasing or decreasing.

```text
Discussion Volume
       │
       ▼
 ┌───────────────┐
 │ Time Window   │
 └───────┬───────┘
         │
         ▼
 Volume Velocity
```

A sudden increase in discussion volume can indicate increased market attention.

---

# 📈 Composite Trading Signal

The final quantitative signal combines multiple market indicators:

```text
                 ┌─────────────────┐
                 │   Sentiment     │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ TF-IDF Momentum │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Volume Velocity │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Composite Signal│
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Confidence      │
                 │ Interval        │
                 └─────────────────┘
```

The resulting signal provides a quantitative representation of market discussion dynamics.

> **Note:** The generated signal is an analytical indicator and should not be treated as financial advice or a standalone trading strategy.

---

# 📐 Statistical Confidence Estimation

Bootstrap resampling is used to estimate confidence intervals around generated signals.

This provides additional statistical context instead of relying solely on a single point estimate.

```text
Collected Data
      │
      ▼
Bootstrap Samples
      │
      ▼
Signal Distribution
      │
      ▼
Confidence Interval
```

---

# 📊 Memory-Efficient Visualization

The visualization layer is designed to handle large datasets without loading the entire dataset into memory.

### Techniques Used

* Reservoir Sampling
* Chunked PyArrow dataset reading
* Streaming processing
* Incremental aggregation

This makes the system more suitable for large-scale market discussion datasets.

---

# 📉 Generated Analytics

After successful execution, the system generates analytical visualizations.

### Signal Time Series

```text
output/plots/
└── signal_timeseries.png
```

Displays market signal behavior over time.

### Volume Heatmap

```text
output/plots/
└── volume_heatmap.png
```

Visualizes discussion volume and market attention patterns.

---

# 📂 Project Structure

```text
market-intel-system/
│
├── src/
│   │
│   ├── scraper/
│   │   ├── selenium_scraper.py
│   │   ├── rate_limiter.py
│   │   └── mock_generator.py
│   │
│   ├── processing/
│   │   ├── text_cleaner.py
│   │   └── normalizer.py
│   │
│   ├── storage/
│   │   ├── parquet_writer.py
│   │   ├── simhash.py
│   │   └── schema.py
│   │
│   ├── signals/
│   │   ├── tfidf.py
│   │   ├── sentiment.py
│   │   ├── signal_engine.py
│   │   └── confidence.py
│   │
│   └── visualization/
│       └── streaming_plotter.py
│
├── config/
│   └── settings.py
│
├── data/
│   └── processed/
│
├── output/
│   └── plots/
│
├── docs/
│   └── TECHNICAL_APPROACH.md
│
├── main.py
├── requirements.txt
└── README.md
```

---

# 🛠 Technology Stack

## Data Collection

* Python
* Selenium
* Undetected ChromeDriver

---

## Data Processing

* Python
* NLP / Text Processing
* Hashing
* SimHash
* Locality-Sensitive Hashing

---

## Analytics

* TF-IDF
* Sentiment Analysis
* Bootstrap Statistics
* Volume Velocity

---

## Storage

* Apache Parquet
* PyArrow
* Snappy Compression

---

## Visualization

* Matplotlib
* Reservoir Sampling
* Streaming Data Processing

---

# ⚡ Performance & Scalability

The architecture focuses on efficient processing of large volumes of social-market data.

### Algorithmic Efficiency

| Component                | Approach             |
| ------------------------ | -------------------- |
| Exact Deduplication      | O(1) Hash Lookup     |
| Near-Duplicate Detection | 64-bit SimHash / LSH |
| Data Storage             | Columnar Parquet     |
| Compression              | Snappy               |
| Large Dataset Processing | Chunked PyArrow      |
| Visualization            | Reservoir Sampling   |
| Data Collection          | Producer-Consumer    |
| Rate Control             | Token Bucket         |

---

# 🔄 Pipeline Architecture

The system separates data collection from processing using a Producer-Consumer architecture.

```text
                 ┌─────────────────┐
                 │ Scraper Workers │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Processing Queue│
                 └────────┬────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Processing Workers    │
              │                       │
              │ • Cleaning            │
              │ • Deduplication       │
              │ • Feature Extraction │
              └───────────┬───────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Parquet Storage │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Signal Engine   │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Visualization  │
                 └─────────────────┘
```

This architecture allows the collection and processing stages to scale independently.

---

# 📊 Sample Output

After running the pipeline, generated files can be found in:

### Processed Market Data

```text
data/processed/date=YYYY-MM-DD/
```

Contains cleaned and deduplicated Parquet datasets.

### Analytical Results

```text
output/plots/
```

Contains:

```text
signal_timeseries.png
volume_heatmap.png
```

---

# 🧪 Testing

Use mock mode to test the complete pipeline without relying on live data collection:

```bash
python main.py \
  --mock \
  --hashtags "#nifty50" "#sensex" "#intraday" "#banknifty" \
  --target-count 1200 \
  --workers 4
```

This is recommended for:

* Local development
* Unit/integration testing
* CI/CD pipelines
* Performance benchmarking
* Algorithm validation

---

# 📚 Technical Documentation

For a deeper explanation of the system architecture, algorithmic decisions, performance trade-offs, and scalability considerations:

```text
docs/TECHNICAL_APPROACH.md
```

The document covers:

* Architecture decisions
* Deduplication strategy
* Data storage design
* Signal generation methodology
* Memory optimization
* Scalability strategy
* Performance considerations

---

# 🔒 Responsible Data Collection

The system is intended for research, analytics, and market intelligence purposes.

When collecting public online data, ensure that your implementation complies with:

* Applicable laws and regulations
* Platform terms of service
* Rate limits
* Authentication requirements
* Privacy requirements

---

# 📌 Project Highlights

The Indian Market Intelligence System is designed to be:

* ⚡ High Performance
* 📈 Quantitative
* 🧠 Algorithm Driven
* 💾 Memory Efficient
* 📦 Big Data Ready
* 🔄 Resilient
* 🧩 Modular
* 🚀 Scalable
* 📊 Analytics Focused
* 🧪 CI/CD Friendly
* 🏗️ Production Oriented

---

# 🚀 Status

**Production-Oriented Research & Analytics System**

**Stack:** Python • Selenium • Undetected ChromeDriver • SimHash • LSH • TF-IDF • Parquet • PyArrow • Snappy • Matplotlib
