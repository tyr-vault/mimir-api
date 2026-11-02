<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/rdvid/mimir-api">
    <img src="public/uploads/logo.png" alt="Mimir Logo" width="80" height="80">
  </a>

<h3 align="center">Mimir</h3>

  <p align="center">
    Personal finance API — JWT auth, transactions, categories, and filterable summaries for bots and dashboards.
    <br />
    <a href="http://localhost:5000/api/docs"><strong>Swagger UI »</strong></a>
    ·
    <a href="http://localhost:5000/api/redoc"><strong>ReDoc »</strong></a>
    <br />
    <br />
    <a href="https://github.com/rdvid/mimir-api">View Repo</a>
    &middot;
    <a href="https://github.com/rdvid/mimir-api/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/rdvid/mimir-api/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#api-overview">API Overview</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

**Mimir** is a minimal personal finance REST API. It focuses on a small, clear surface area that is easy to call from a chatbot, CLI, or dashboard:

- Register / login with JWT (Bearer token)
- Flat **transactions** (income or expense, one row per line item)
- User-owned **categories** (defaults seeded on register)
- **Summaries** with date / type / category filters (e.g. spend in the last 7 days)

Local Docker Compose includes hot reload and an idempotent **demo seed** so you can explore the API immediately.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![Node.js][Node.js]][Node-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Express.js][Express.js]][Express-url]
* [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
* [![Knex.js][Knex.js]][Knex-url]
* [![Docker][Docker]][Docker-url]
* [![JWT][JWT]][JWT-url]
* [![Swagger][Swagger]][Swagger-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

* [Docker](https://docs.docker.com/get-docker/) and Docker Compose
* [Make](https://www.gnu.org/software/make/) (optional but recommended)
* Node.js 24+ (only if running outside Docker)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/rdvid/mimir-api.git
   cd mimir-api
   ```
2. Start the stack (creates `.local.env` from `.env.default` if needed, applies migrations, seeds demo data)
   ```sh
   make up
   # or foreground with logs:
   make dev
   ```
3. Open the API
   - API: [http://localhost:5000](http://localhost:5000)
   - Swagger UI: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
   - ReDoc (dark): [http://localhost:5000/api/redoc](http://localhost:5000/api/redoc)
   - OpenAPI JSON: [http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)
   - Download for Postman: [http://localhost:5000/api/docs.json?download=1](http://localhost:5000/api/docs.json?download=1)

#### Environment

`make setup` links `.env` → `.local.env`. Relevant variables:

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `5000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET_KEY` | JWT signing secret |
| `ACCESS_TOKEN_SECRET_EXPIRY` | JWT TTL (e.g. `7d`) |

In Docker, the API uses `postgres://mimir:mimir@postgres:5432/budgetter` (compose override). For host-side tools, `.local.env` typically points at `localhost:5432`.

#### Useful Make targets

| Command | Description |
|---------|-------------|
| `make help` | List targets |
| `make up` / `make dev` | Start stack (background / foreground) with demo seed |
| `make seed` | Re-run demo seed (idempotent) |
| `make logs` | Follow API logs |
| `make down` | Stop stack |
| `make nuke` | Wipe volumes (DB + node_modules volume) |

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

### Demo account

When `SEED_DEMO=true` (enabled in the Docker Compose **dev** overlay), boot creates:

| Field | Value |
|-------|--------|
| Email | `admin@example.com` |
| Password | `admin` |

Includes default categories and sample transactions over the last ~30 days. Seed is idempotent; reset with `make nuke && make up`.

### Quick auth + summary example

```sh
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# Past week expenses
curl -s "http://localhost:5000/summary?from=2026-09-12&to=2026-09-19&type=expense" \
  -H "Authorization: Bearer $TOKEN"
```

### Import into Postman

1. Download [mimir-openapi.json](http://localhost:5000/api/docs.json?download=1)
2. Postman → **File → Import** → select the file
3. Authorize requests with the JWT from `/auth/login`

_For full schemas and try-it-out, see [Swagger UI](http://localhost:5000/api/docs) or [ReDoc](http://localhost:5000/api/redoc)._

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- API OVERVIEW -->
## API Overview

All successful JSON responses follow:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account + seed default categories |
| POST | `/auth/login` | — | Return `{ token, user }` |
| GET | `/categories` | JWT | List categories |
| POST | `/categories` | JWT | Create category |
| POST | `/transactions` | JWT | Create transaction |
| GET | `/transactions` | JWT | List (filterable) |
| GET | `/transactions/:id` | JWT | Get one |
| PATCH | `/transactions/:id` | JWT | Update |
| DELETE | `/transactions/:id` | JWT | Delete |
| GET | `/summary` | JWT | Period totals |
| GET | `/summary/categories` | JWT | Totals by category |
| GET | `/summary/monthly` | JWT | Totals by month (`year` required) |

### List / summary filters

Available on `GET /transactions`, `GET /summary`, and `GET /summary/categories`:

- `from` / `to` — `YYYY-MM-DD` (inclusive)
- `type` — `expense` \| `income`
- `categoryId` — UUID
- `limit` / `offset` — list only (default limit 50, max 200)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [x] JWT register / login
- [x] Transactions CRUD + filters
- [x] Categories + default seed
- [x] Period / category / monthly summaries
- [x] Swagger UI + ReDoc + OpenAPI export
- [x] Docker hot-reload + demo data
- [ ] Telegram / WhatsApp bot integration
- [ ] Dashboard frontend
- [ ] Category update / delete
- [ ] Recurring transactions

See the [open issues](https://github.com/rdvid/mimir-api/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/rdvid/mimir-api/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rdvid/mimir-api" alt="contrib.rocks image" />
</a>



<!-- LICENSE -->
## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Rafael David — [GitHub @rdvid](https://github.com/rdvid)

Project Link: [https://github.com/rdvid/mimir-api](https://github.com/rdvid/mimir-api)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
* [Swagger UI](https://swagger.io/tools/swagger-ui/)
* [ReDoc](https://github.com/Redocly/redoc)
* [Knex.js](https://knexjs.org/)
* [Shields.io](https://shields.io/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/rdvid/mimir-api.svg?style=for-the-badge
[contributors-url]: https://github.com/rdvid/mimir-api/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/rdvid/mimir-api.svg?style=for-the-badge
[forks-url]: https://github.com/rdvid/mimir-api/network/members
[stars-shield]: https://img.shields.io/github/stars/rdvid/mimir-api.svg?style=for-the-badge
[stars-url]: https://github.com/rdvid/mimir-api/stargazers
[issues-shield]: https://img.shields.io/github/issues/rdvid/mimir-api.svg?style=for-the-badge
[issues-url]: https://github.com/rdvid/mimir-api/issues
[license-shield]: https://img.shields.io/github/license/rdvid/mimir-api.svg?style=for-the-badge
[license-url]: https://github.com/rdvid/mimir-api/blob/main/LICENSE

[Node.js]: https://img.shields.io/badge/Node.js_24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[Node-url]: https://nodejs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Express.js]: https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Knex.js]: https://img.shields.io/badge/Knex.js-D26B38?style=for-the-badge&logo=knexdotjs&logoColor=white
[Knex-url]: https://knexjs.org/
[Docker]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
[JWT]: https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white
[JWT-url]: https://jwt.io/
[Swagger]: https://img.shields.io/badge/OpenAPI-6BA539?style=for-the-badge&logo=swagger&logoColor=white
[Swagger-url]: https://swagger.io/
