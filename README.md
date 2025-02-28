# mrccaptcha/examples

## Overview

This repository provides example implementations for solving Funcaptcha using the services of [mrccaptcha.com](https://mrccaptcha.com). It includes sample code and integration guides to help you use the service effectively in your projects.

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/mrccaptcha/examples.git
```

### 2. Install Dependencies
```bash
cd examples
npm install
```

### 3. Configure Environment Variables
Copy the `.env.example` file and rename it to `.env`:
```bash
cp .env.example .env
```
Then open `.env` and add your API key from [mrccaptcha.com](https://mrccaptcha.com):
```
MRCCAPTCHA_API_KEY=your_api_key_here
PROXY_PATTERN=your_proxy_pattern_here
PROXY_REGIONS=region1,region2,region3
```

### Proxy Configuration
- **PROXY_PATTERN**: This defines the pattern for generating sticky proxies. The system will randomize the proxy selection based on this pattern.
- **PROXY_REGIONS**: A comma-separated list of regions that will be used to randomize the sticky proxy.

#### Sticky Session Proxy
A sticky session proxy maintains the same IP for a certain period, reducing the chances of triggering anti-bot mechanisms. By defining `PROXY_PATTERN` and `PROXY_REGIONS`, you ensure that the proxy remains stable while still offering region-based rotation.

## Usage

To test Funcaptcha solving for account creation on X (Twitter) using mobile devices, run the corresponding script:
```bash
node ./src/x-signup-mobile.js
```
For other platforms, replace the script with the appropriate file from the `src` directory.

### User-Agent Considerations
Different devices only support specific browsers. When configuring user agents, ensure they match the target device:
- **Android**: Chrome, Edge
- **iPhone**: Chrome, Safari
- **iPad**: Chrome, Safari
- **Windows**: Chrome, Edge
- **macOS**: Chrome, Edge, Safari
- **Twitter App Android**: Falls under Android category, supports only X (Twitter)

### Best Practices
- Use the **random user-agent API** from [mrccaptcha.com](https://mrccaptcha.com) to generate diverse user agents.
- Regularly rotate user agents and IPs to avoid detection and minimize the risk of being banned by Funcaptcha.

## Contributing

We welcome contributions from the community! To contribute, please follow these steps:
1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Commit your changes
4. Open a pull request

## License

This repository is licensed under the MIT License. See the `LICENSE` file for details.

---
For more information on mrccaptcha.com and how to use the service, visit the [official website](https://mrccaptcha.com).
