const { GamesSearchList } = require("../models/game-search-list-model");
const Developers = require("../models/developer-model");
const Publishers = require("../models/publisher-model");
const Platforms = require("../models/platform-model");
const Games = require("../models/game-model");
const AllGamesList = require("../models/all-games-model");
const Users = require("../models/users-model");

const GameDto = require("../dtos/game-dto");
const GamesListDto = require("../dtos/gamelist-dto");

const collectionService = require("../services/collection-service");
const dbFileds = "-_id-__v";

class GameService {
  async markInCollectionItems(userId, searchResult) {
    const currUserGameCollectionIds = (await Users.findById(userId))
      .gamesCollection.ids;

    return searchResult.map((e) => {
      e.inCollection = currUserGameCollectionIds.includes(e.id);
      return e;
    });
  }

  async checkStoredSearchList(searchQuery, userId) {
    const storedResult = await GamesSearchList.findOne({ searchQuery });
    if (storedResult) {
      const result = this.markInCollectionItems(userId, storedResult.list);
      return result;
    }
    return storedResult;
  }

  async saveSearchList(searchQuery, apiResponse, userId) {
    const list = apiResponse.results.map((item) => new GamesListDto(item));
    const newSearchList = await GamesSearchList.create({ searchQuery, list });

    return this.markInCollectionItems(userId, newSearchList.list);
  }

  async checkStoredGame(detailsUrl, userId) {
    // //GameBomb API
    // const storedResult = await await this.populateGameDetails(
    //   Games.findOne({ detailsUrl })
    // );
    // if (storedResult) {
    //   const isInCollection = storedResult.inCollectionUsers.some(
    //     (e) => e.toString() === userId
    //   );
    //   const { inCollectionUsers, _id, ...result } = storedResult;
    //   return { ...result, inCollection: isInCollection };
    // }
    // return storedResult;
  }

  async checkStoredGameDetails(id, userId) {
    const storedResult = await this.populateGameDetails(Games.findOne({ id }));
    if (storedResult) {
      const isInCollection = storedResult.inCollectionUsers.some(
        (e) => e.toString() === userId
      );

      const time = await collectionService.setGameTime(userId, id);

      const { inCollectionUsers, _id, ...result } = storedResult;
      if (time) {
        result.playedTime = time;
      }
      return { ...result, inCollection: isInCollection };
    }

    return storedResult;
  }

  async saveGameDetails(apiResponse) {
    const game = new GameDto(apiResponse);
    const { id, developers, publishers, platforms } = game;

    const devObjIds = await this.insertToCollection(developers, Developers);
    const pubObjIds = await this.insertToCollection(publishers, Publishers);
    const platObjIds = await this.insertToCollection(platforms, Platforms);

    const newGame = new Games({
      ...game,
      developers: devObjIds,
      publishers: pubObjIds,
      platforms: platObjIds,
    });

    await newGame.save();
    const { inCollectionUsers, _id, ...result } =
      await this.populateGameDetails(Games.findOne({ id }));

    return result;
  }

  async checkStoredAllGamesListPage(page, userId) {
    const storedPage = await AllGamesList.findOne({ page }).select(dbFileds);

    if (userId && storedPage?.list?.length) {
      // const userCollection = await Users.findById(userId);
      // const result = storedPage.list?.map((e) => {
      //   if (userCollection.gamesCollection.ids.includes(e.id)) {
      //     e.inCollection = true;
      //   }
      //   return e;
      // });

      return await this.markInCollectionItems(userId, storedPage.list);
    }
    return storedPage?.list;
  }

  async saveAllGamesListPage(page, data) {
    const list = data.results.map((e) => new GamesListDto(e));
    return AllGamesList.create({ page, list });
  }

  async insertToCollection(array, collection) {
    if (!array || !array.length) return [];
    return Promise.all(
      array.map(async (e) => {
        const existItem = await collection.findOne({ id: e?.id });
        return existItem ? existItem._id : (await collection.create(e))._id;
      })
    );
  }

  async populateGameDetails(query) {
    return query
      .populate({ path: "developers", select: dbFileds })
      .populate({ path: "publishers", select: dbFileds })
      .populate({ path: "platforms", select: dbFileds })
      .lean();
  }
}

module.exports = new GameService();
