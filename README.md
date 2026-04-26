
# URL Shortener

A production-ready URL shortener backend built with Node.js, Express, Prisma, and MongoDB featuring Redis caching, per-URL analytics, custom aliases, and cookie-based JWT auth.


## Features

- URL Shortening: Shorten any URL with a nanoid-generated 6-character code
- Custom Aliases: Optionally provide your own short code instead of the auto-generated one
- Duplicate Detection: If you shorten the same URL twice, your existing short URL is returned (no duplicates per user)
- My URLs: GET /getMyUrls returns all short URLs belonging to the logged-in user
- Update Short Code: Rename a short URL's code/alias at any time via PATCH /updateCode/:id
- Custom Aliases: Optionally provide your own short code instead of the auto-generated one
- Delete URLs: Remove any of your own short URLs
- Analytics: Per-URL stats: total clicks, mobile %, desktop %, and the 5 most recent clicks
- Redis Caching: URL lists and analytics are cached with a 1-hour TTL; cache is invalidated on every write
- Cookie-based Auth: JWT stored in an httpOnly cookie with a 21-day expiry



## Tech Stack

**Server:** Node, Express

**Database:** MongoDB

**ORM:** Prisma

**Caching:** Redis


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`DATABASE_URL`="mongodb+srv://<user>:<password>@cluster.mongodb.net/urlshortener"

`REDIS_URL`="redis://localhost:6379"

`JWT_SECRET`="your_jwt_secret"

`BASE_URL`="http://localhost:8000"

`PORT`=8000


## Installation

git clone https://github.com/PRONOY0/url-shortener.git

```bash
  cd url-shortener
  npm install
  cd .env.example .env
  npx prisma generate
  redis-server
  npm run dev
```
    
## API Reference

---

### Auth
```http
POST /api/v1/signup
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `email` | `string` | **Required** Unique email |
| `password` | `string` | **Required**  |

```http
POST /api/v1/login
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `email` | `string` | **Required**  |
| `password` | `string` | **Required**  |


### Create Short URL

```http
POST /api/v1/createLink
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `sentLink` | `string` | **Required** Original URL to shorten |
| `customAliases` | `string` | **Optional** Custom short code (must be unique) |

#### Get URL

```http
GET /:code
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `code`      | `string` | **Required** Short URL code |

```http
GET /api/v1/showAnalytics/:id
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required** Shortened URL document ID |

```http
GET /api/v1/getMyUrls
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `Authorization`      | `string` | **Required** Bearer token |


```http
PATCH /api/v1/updateCode/:shortenedUrlId
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required** Shortened URL document ID |
| `customAliases`      | `string` | **Required** New unique code |

#### Delete Short URL
```http
/api/v1/delete/:id
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required** Shortened URL document ID |




## License

[MIT](https://choosealicense.com/licenses/mit/)

