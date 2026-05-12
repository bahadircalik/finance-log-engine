# Fintech Log Ingestion and Validation System

This project is a secure pipeline designed to process financial transaction logs in real-time. It validates data quality, ensures security, and automatically moves broken or corrupted logs into a safe quarantine index without stopping the system.

## Project Files and Roles

* **`docker-compose.yml`**
  * **Role:** System Infrastructure.
  * **Function:** Starts, configures, and connects all services (Node.js, Elasticsearch, Logstash, and Kibana) together inside safe Docker containers.

* **`node-validator/server.js`**
  * **Role:** First Security Gate.
  * **Function:** A Node.js API protected by JWT authentication. It verifies user permissions, checks basic data structure, and blocks invalid external requests before they can enter the processing line.

* **`node-validator/.env`**
  * **Role:** Private Configuration.
  * **Function:** Safely stores system ports, secret security keys, database URLs, and passwords.

* **`logstash/pipeline/logstash.conf`**
  * **Role:** Second Data Gate.
  * **Function:** Reads incoming log streams line by line. It checks data formats (for example, making sure transaction amounts contain numbers instead of letters) and routes the data to the correct location.

## Data Routing and Management

1. **Successful Logs:** Clean data with correct formats is saved directly into the main production index (`banka-islemleri`).
2. **Quarantined Logs:** Data with incorrect types or formats is automatically tagged as an error and isolated into a separate quarantine index (`banka-hatali-kayitlar`). This prevents database corruption.
3. **High-Value Auditing:** Clean transactions that exceed safe monetary limits are automatically tagged for easy monitoring on Kibana dashboards.
