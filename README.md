# Verdant

AWS security posture dashboard — analyse your cloud against the CIS AWS Foundations Benchmark.

## Features

- **Offline mode:** Run a bash script locally, upload the JSON snapshot. All analysis runs client-side — no credentials leave your machine.
- **Online mode:** Provide read-only IAM credentials. A Lambda function runs the checks and returns results. Credentials are never stored.
- **CIS Benchmark scoring:** 16 checks across IAM, Logging, Monitoring, Networking, and Storage.
- **Interactive scorecard:** Pass/fail/warning per check, severity ratings, plain-English risk explanations, remediation steps.
- **Trend tracking:** See your security posture improve over time.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + Vite
- **Backend:** AWS Lambda (Python 3.12) + API Gateway
- **Database:** DynamoDB (on-demand)
- **Infrastructure:** Terraform (eu-west-2)
- **Hosting:** S3 + Cloudflare

## Live

[verdant.nfroze.co.uk](https://verdant.nfroze.co.uk)
