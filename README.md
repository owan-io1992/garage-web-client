# garage-web-client
this project is a web client for [garage](https://garagehq.deuxfleurs.fr), host on github pages  

The application runs 100% in the browser, so you can safely access any garage instance from there.

# Development

## requirements
- [mise](https://github.com/mise-sh/mise)
- [docker compose](https://docs.docker.com/compose/)

install dependencies:  
```bash
mise install
```

## start garage
```bash
cd garage

# initialize
docker compose up -d
docker compose exec garaged /garage status 
docker compose exec garaged /garage layout assign -z dc1 -c 1G
docker compose exec garaged /garage layout apply --version 1

# create a bucket
docker compose exec garaged /garage bucket create dev-bucket
docker compose exec garaged /garage bucket list

docker compose exec garaged /garage key create dev-app-key
docker compose exec garaged /garage bucket allow \
  --read \
  --write \
  --owner \
  dev-bucket \
  --key dev-app-key

docker compose exec garaged /garage bucket info dev-bucket

# test
export AWS_ACCESS_KEY_ID=xxxx      # put your Key ID here
export AWS_SECRET_ACCESS_KEY=xxxx  # put your Secret key here
export AWS_DEFAULT_REGION='garage'
export AWS_ENDPOINT_URL='http://localhost:3900'

aws s3 ls s3://dev-bucket
```

## start garage-web-client
```bash
cd 
moon garage-web-client:dev
```

open http://localhost:5173
