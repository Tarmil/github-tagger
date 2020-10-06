"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const ifExistsActions = ["fail", "replace", "ignore"];
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = core.getInput("repo-token", { required: true });
            const tag = core.getInput("tag", { required: true });
            const sha = core.getInput("commit-sha", { required: false }) || github.context.sha;
            const ifExistsStr = core.getInput("if-exists", { required: false });
            const ifExists = ifExistsActions.find(x => x === ifExistsStr) || "fail";
            const client = new github.GitHub(token);
            const args = {
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                ref: `refs/tags/${tag}`
            };
            const exists = yield client
                .request(`GET /repos/:owner/:repo/git/:ref`, args)
                .catch(_ => false);
            if (exists) {
                const msg = `Tag ${tag} already exists.`;
                core.debug(msg);
                core.debug(`if-exists: ${ifExists}`);
                switch (ifExists) {
                    case "fail":
                        core.setFailed(msg);
                        return;
                    case "replace":
                        yield client.request(`DELETE /repos/:owner/:repo/git/:ref`, args);
                        break;
                    case "ignore":
                        return;
                }
            }
            core.debug(`tagging #${sha} with tag ${tag}`);
            yield client.git.createRef(Object.assign({ sha: sha }, args));
        }
        catch (error) {
            core.error(error);
            core.setFailed(error.message);
        }
    });
}
run();
