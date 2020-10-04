import * as core from "@actions/core";
import * as github from "@actions/github";

const ifExistsActions = ["fail", "replace", "ignore"] as const;
type IfExistsAction = typeof ifExistsActions[number];

async function run() {
  try {
    const token = core.getInput("repo-token", { required: true });
    const tag = core.getInput("tag", { required: true });
    const sha =
      core.getInput("commit-sha", { required: false }) || github.context.sha;
    const moveExistingStr = core.getInput("if-exists", { required: false });
    const moveExisting: IfExistsAction =
      ifExistsActions.find(x => x === moveExistingStr) || "fail";

    const client = new github.GitHub(token);

    const args = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      ref: `refs/tags/${tag}`
    };

    const exists = await client
      .request(`GET /repos/:owner/:repo/git/:ref`, args)
      .catch(_ => false);
    if (exists) {
      const msg = `Tag ${tag} already exists.`;
      core.debug(msg);
      switch (moveExisting) {
        case "fail":
          core.setFailed(msg);
          return;
        case "replace":
          await client.request(`DELETE /repos/:owner/:repo/git/:ref`, args);
          break;
        case "ignore":
          return;
      }
    }

    core.debug(`tagging #${sha} with tag ${tag}`);
    await client.git.createRef({ sha: sha, ...args });
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
