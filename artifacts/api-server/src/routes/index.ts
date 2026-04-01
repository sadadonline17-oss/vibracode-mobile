import { Router, type IRouter } from "express";
import healthRouter from "./health";
import e2bRouter from "./e2b";
import chatRouter from "./chat";
import transcribeRouter from "./transcribe";
import ollamaRouter from "./ollama";
import providersRouter from "./providers";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/e2b", e2bRouter);
router.use("/chat", chatRouter);
router.use("/transcribe", transcribeRouter);
router.use("/ollama", ollamaRouter);
router.use("/providers", providersRouter);

export default router;
