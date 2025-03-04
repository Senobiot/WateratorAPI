const jwt = require("jsonwebtoken");
const tokenModel = require("../models/token-model");

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    return { accessToken, refreshToken };
  }

  async saveToken(userId, refreshToken) {
    const tokenData = await tokenModel.findOne({ user: userId });

    if (tokenData) {
      tokenData.refreshToken = refreshToken;
      return tokenData.save();
    }

    const token = await tokenModel.create({ user: userId, refreshToken });
    return token;
  }

  async removeToken(refreshToken) {
    const tokenData = await tokenModel.deleteOne(refreshToken);
    return tokenData;
  }

  validateAccessToken(token) {
    try {
      const verifiedToken = jwt.verify(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET
      );

      return verifiedToken;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  validateRefreshToken(token) {
    try {
      const verifiedToken = jwt.verify(
        token,
        process.env.JWT_REFRESH_TOKEN_SECRET
      );
      return verifiedToken;
    } catch (error) {
      return null;
    }
  }

  async searchToken(refreshToken) {
    const tokenData = await tokenModel.findOne({ refreshToken });
    return tokenData;
  }
}

module.exports = new TokenService();
