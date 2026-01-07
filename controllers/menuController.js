const { getMenuByRoleId } = require("../model/MenuModel");

exports.getMenu = async (req, res) => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    if (isNaN(roleId)) {
      return res.status(400).json({ error: "Invalid roleId" });
    }
    const menu = await getMenuByRoleId(roleId);
    res.json({ menu });
  } catch (e) {
    console.error("Get menu error:", e);
    res.status(500).json({ error: e.message });
  }
};
