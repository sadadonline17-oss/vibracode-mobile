import { Router, type IRouter } from "express";
import healthRouter from "./health";
import e2bRouter from "./e2b";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/e2b", e2bRouter);

export default router;
