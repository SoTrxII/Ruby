import "reflect-metadata";
import { container } from "./inversify.config";
import { TYPES } from "./types";
import { Ruby } from "./Ruby";

const ruby = container.get<Ruby>(TYPES.Ruby);
ruby.bootUp();