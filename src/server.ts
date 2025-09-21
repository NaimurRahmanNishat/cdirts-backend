import app from "./app";
import config from "./config";
import dbConnect from "./utils/db";

app.listen(config.port, () => {
  dbConnect();
  console.log(`🚀 Server is running on port http://localhost:${config.port}`);
});
