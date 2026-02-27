import express from "express";
import cors from "cors";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const app = express();
const upload = multer();

app.use(cors());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const fileName = Date.now() + "-" + file.originalname;

    const { error } = await supabase.storage
      .from("Mini app")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("Mini app")
      .getPublicUrl(fileName);

    res.json({ url: data.publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
