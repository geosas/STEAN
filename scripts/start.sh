pm2 stop index
rm -r api
unzip dist.zip -d api/
cd api
npm install --production
node index.js
