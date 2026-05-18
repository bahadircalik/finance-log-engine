# Fintech Transaction Observability Engine

A real-time financial log validation and ingestion pipeline featuring JWT authentication, automated anomaly quarantine routing (Dead Letter Queue), and centralized ELK Stack observability.

---

## 1. Directory Structure

```text
fintech-transaction-observability-engine/
├── docker-compose.yml              # Provisions ELK stack infrastructure (xpack.security.enabled: true)
├── logstash.conf                   # Ingests and parses internal microservice HTTP streams
└── transaction-service/            # Public-facing Node.js API Gateway core
    ├── server.js                   # Handles JWT authentication and payload validation rules
    ├── package.json                # Project environment blueprints and dependency versions
    └── .env                        # Stores cluster secret keys, system ports, and credentials

    Service Name,Port,Username / Identity,Password / Secret Key,Technical Access Role
Node.js API Gateway,3000,admin (API Client),ProductionPassword2026!,Public gate. Validates JWT signatures and checks field integrity.
Logstash Pipeline,8080,Internal Core Worker,Network Isolated,Ingests raw HTTP streams from internal backend microservices.
Elasticsearch DB,9200,elastic (Superuser),ProductionPassword2026!,Encrypted data vault storing corporate transactional ledger entries.
Kibana UI Dashboard,5601,kibana_system,ProductionPassword2026!,Operations tower for running real-time visual system telemetries.


3. Data Routing & Anomaly Management
The engine evaluates incoming transactions on-the-fly and applies structural routing parameters:

Production Pool (transactions-validated)

Valid logs with complete shapes and precise numeric values (e.g., amt: "1250.75") are stamped with validation_status: "success" and saved directly here for analytical processing.

Automated Quarantine (transactions-quarantine)

Payload entries missing mandatory data or carrying data errors (e.g., empty string values like amt: "") trip validation constraints. The gateway captures the failure without crashing, stamps it with validation_status: "quarantined" and error_reason: "Missing mandatory fields", and routes it here (Dead Letter Queue pattern).


Markdown
# Fintech Transaction Observability Engine

A real-time financial log validation and ingestion pipeline featuring JWT authentication, automated anomaly quarantine routing (Dead Letter Queue), and centralized ELK Stack observability.

---

## 1. Directory Structure

```text
fintech-transaction-observability-engine/
├── docker-compose.yml              # Provisions ELK stack infrastructure (xpack.security.enabled: true)
├── logstash.conf                   # Ingests and parses internal microservice HTTP streams
└── transaction-service/            # Public-facing Node.js API Gateway core
    ├── server.js                   # Handles JWT authentication and payload validation rules
    ├── package.json                # Project environment blueprints and dependency versions
    └── .env                        # Stores cluster secret keys, system ports, and credentials
2. Ports, Identities & Credentials
Service Name	Port	Username / Identity	Password / Secret Key	Technical Access Role
Node.js API Gateway	3000	admin (API Client)	ProductionPassword2026!	Public gate. Validates JWT signatures and checks field integrity.
Logstash Pipeline	8080	Internal Core Worker	Network Isolated	Ingests raw HTTP streams from internal backend microservices.
Elasticsearch DB	9200	elastic (Superuser)	ProductionPassword2026!	Encrypted data vault storing corporate transactional ledger entries.
Kibana UI Dashboard	5601	kibana_system	ProductionPassword2026!	Operations tower for running real-time visual system telemetries.
3. Data Routing & Anomaly Management
The engine evaluates incoming transactions on-the-fly and applies structural routing parameters:

Production Pool (transactions-validated)

Valid logs with complete shapes and precise numeric values (e.g., amt: "1250.75") are stamped with validation_status: "success" and saved directly here for analytical processing.

Automated Quarantine (transactions-quarantine)

Payload entries missing mandatory data or carrying data errors (e.g., empty string values like amt: "") trip validation constraints. The gateway captures the failure without crashing, stamps it with validation_status: "quarantined" and error_reason: "Missing mandatory fields", and routes it here (Dead Letter Queue pattern).

4. Postman Automated Load Test Script
Paste this routine inside your Postman (Pre-request Script). Clicking "Send" once automates login, harvests an active JWT token, compiles 35 Flawless Payments and 15 Defective Anomalies, and injects them into the gateway at 40ms pacing intervals:

// 1. Authenticate and Fetch JWT Bearer Token
pm.sendRequest({
    url: '[http://127.0.0.1:3000/login](http://127.0.0.1:3000/login)',
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: { mode: 'raw', raw: JSON.stringify({ username: "admin", password: "ProductionPassword2026!" }) }
}, function (err, res) {
    if (err) return console.log("❌ Authentication Failure:", err);
    const token = res.json().token;
    console.log("🟢 Valid JWT Passport Secured! Deploying 50 Ingestion Fuses...");

    // 2. Build 50 Real-Time Load Scenarios
    let logs = [];
    for (let i = 1; i <= 50; i++) {
        if (i <= 35) {
            logs.push({
                txn_id: "TXN_ENGINE_PROD_" + Math.floor(Math.random() * 10000) + "_" + i,
                bank: i % 2 === 0 ? "YapiKredi" : "IsBankasi",
                user: "bahadircalik",
                amt: (1500 + i * 25).toFixed(2), // Valid Float property matching Strict Mappings
                currency: "TRY",
                operation: "ENTERPRISE_VOLUME_LOAD"
            });
        } else {
            logs.push({
                txn_id: "TXN_SABOTAJ_BOT_" + Math.floor(Math.random() * 10000) + "_" + i,
                bank: "SuspiciousGate",
                user: "stolen_card_bot",
                amt: "", // Triggers Quarantine filter rules
                currency: "TRY",
                operation: "SECURITY_QUARANTINE_DROP"
            });
        }
    }

    // 3. High-Throughput Burst Injection Sequence
    logs.forEach(function(data, index) {
        setTimeout(function() {
            pm.sendRequest({
                url: '[http://127.0.0.1:3000/](http://127.0.0.1:3000/)',
                method: 'POST',
                header: { 'Content-Type': 'application/json', 'Authorization': token },
                body: { mode: 'raw', raw: JSON.stringify(data) }
            }, function (err, response) {
                console.log(`🚀 Injected Event #${index + 1} (${data.txn_id}) - Status:`, response.status);
            });
        }, index * 40);
    });
});


5. Critical Edge Cases Resolved (Troubleshooting)
A) The Timestamp Latency Paradox

Incident: Volume injectors confirmed successful writes and database document counts incremented, yet Kibana’s Discover dashboard returned a "No results match your search criteria" error, hiding all documents.

Root Cause: Docker engines record data streams in Coordinated Universal Time (UTC), causing a 3-hour mismatch against the host machine's local time zone. Since the test records lacked explicit historical timestamps, Kibana’s chronological parameters filtered them out.

Resolution: Re-architected Kibana Data Views via Stack Management. Purged the chronologically bound transactions-* pattern and rebuilt it with "I don't want to use the time filter" checked to bypass temporal offsets.

B) Strict Mapping & Schema Type Conflicts

Incident: Submitting textual data inside numeric fields (e.g., amt: "BIN_BESYUZ_TL" or amt: "NaN") caused the Node.js layer to fail silently with 500 Internal Server Error responses. Data dropped completely before hitting quarantine.

Root Cause: Elasticsearch utilizes strict document schema structures. Upon digesting the first clean ledger documents, it locked the amt field key strictly as a Float. Text mutations hitting the same column caused a database mapper_parsing_exception and denied entry, crashing the backend socket runtime.

Resolution: Upgraded validation constraints to dynamically clone and rename corrupt textual data entries to an independent corrupted_amt string key on-the-fly, saving adversarial packets without compromising production index mappings.

6. Infrastructure Activation Commands
Bring up the log validation network cleanly from your terminal layout using these steps:

Bash
# Terminal Tab 1: Start the containerized ELK infrastructure cluster
cd /your-local-path/fintech-transaction-observability-engine
docker-compose up -d

# Terminal Tab 2: Deploy the secure Node.js API validation gateway
cd /your-local-path/fintech-transaction-observability-engine/transaction-service
node server.js

# Live Cluster Ingestion Audit (Execute inside Kibana Dev Tools Console)
GET _cat/indices?v
