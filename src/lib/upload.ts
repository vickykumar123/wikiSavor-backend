import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import {s3} from "./s3.utils";

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `resturant/${req.userId}/${
        file.originalname.split(".")[0]
      }-${Date.now()}`;
      cb(null, `${fileName}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, //5mb
  },
});
