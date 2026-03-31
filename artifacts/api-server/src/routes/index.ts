import { Router, type IRouter } from "express";
import healthRouter from "./health";
import e2bRouter from "./e2b";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/e2b", e2bRouter);
router.use("/chat", chatRouter);

export default router;
