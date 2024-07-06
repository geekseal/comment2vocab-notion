require("dotenv").config();
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const ENTRY_BLOCK_ID = {
  EN: process.env.ENTRY_BLOCK_EN,
  CN: process.env.ENTRY_BLOCK_CN,
};

/**
 * main logic
 */
async function main() {
  const entryPoints = await retrieveChildren(ENTRY_BLOCK_ID.EN);
  const comments = await Promise.all(entryPoints.results.map(getCommentRecursive));
  console.log("final results", comments);
}

/**
 * Since content consists of several depths of blocks,
 * should retrieve comments recursively until there's no child block left.
 * @param {*} content
 * @param {string[]} comments
 * @returns
 */
async function getCommentRecursive(block) {
  if (!block.has_children) {
    const comment = await retrieveComments(block.id);
    return comment.results;
  }

  // TODO: any memory leak while creating new array for every iteration?
  const comments = [];
  const comment = await retrieveComments(block.id);
  comments.push(...comment.results);

  // TODO: any repeated calls?
  async function retrieveCommentsFromChild(child) {
    const fromChild = await getCommentRecursive(child);
    console.log("fromChild", fromChild);
    comments.push(...fromChild);
  }
  const children = await retrieveChildren(block.id);
  await Promise.all(children.results.map(retrieveCommentsFromChild));

  console.log("자식이 있는 경우에만 출력", comments);
  return comments;
}

async function retrieveChildren(blockId) {
  return notion.blocks.children.list({
    block_id: blockId,
    page_size: 50,
  });
}

async function retrieveComments(blockId) {
  return notion.comments.list({ block_id: blockId });
}

function isAlgorithm(title) {
  const regex = new RegExp("^d+.");
  return regex.test(title);
}

/**
 * execution
 */
main();
