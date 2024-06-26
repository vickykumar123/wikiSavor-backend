import {Request} from "express";
import Restaurant from "../../models/restaurant";
import client from "../../redis/client";
import {restaurantDetailKey} from "../../redis/keys";

export const allRestaurant = {
  searchRestaurant: async (args: any, context: {req: Request}) => {
    try {
      const {req} = context;
      const city = args.city;
      if (!city) {
        throw new Error("City is required");
      }
      const searchQuery = (req.query.searchQuery as string) || "";
      const selectedCuisines = (req.query.selectedCuisines as string) || "";
      const sortOption = (req.query.sortOption as string) || "lastUpdate";
      const page = parseInt(req.query.page as string) || 1;

      let query: any = {};
      query["city"] = new RegExp(city, "i");
      const cityCheck = await Restaurant.countDocuments(query);
      if (cityCheck === 0) {
        return {data: [], pagination: {total: 0, page: 1, pages: 1}};
      }
      if (selectedCuisines) {
        const cuisineArray = selectedCuisines
          .split(",")
          .map((cuisines) => new RegExp(cuisines, "i"));

        query["cuisines"] = {$all: cuisineArray};
      }
      if (searchQuery) {
        const searchRegex = new RegExp(searchQuery, "i");
        query["$or"] = [
          {restaurantName: searchRegex},
          {cuisines: {$in: [searchQuery]}},
          {"menuItems.name": searchRegex},
        ];
      }

      const pageSize = 6;
      const skip = (page - 1) * pageSize;
      const restaurant = await Restaurant.find(query)
        .sort({[sortOption]: 1})
        .skip(skip)
        .limit(pageSize)
        .lean();
      const total = await Restaurant.countDocuments(query);
      const result = {
        data: restaurant,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / pageSize),
        },
      };

      return result;
    } catch (error) {
      console.log(error);
      throw new Error("Unable to search by city.");
    }
  },

  restaurantDetail: async ({restaurantId}: {restaurantId: string}) => {
    try {
      if (!restaurantId) {
        throw new Error("Restaurant ID is required");
      }
      const restaurantDetailCache = await client.get(
        restaurantDetailKey(restaurantId)
      );

      if (restaurantDetailCache !== null && restaurantDetailCache !== "null") {
        return JSON.parse(restaurantDetailCache);
      }
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        throw new Error("Restaurant not found");
      }
      await client.set(
        restaurantDetailKey(restaurantId),
        JSON.stringify(restaurant)
      );
      return restaurant;
    } catch (error) {
      console.log(error);
      throw new Error("Unable to get restaurant details");
    }
  },
};
