const paginateQuery = async (model, filter, options = {}) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const skip = (page - 1) * limit;
    const sort = options.sort || { createdAt: -1 };

    const cursor = model.collection().find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

    const data = await cursor.toArray();
    const total = await model.collection().countDocuments(filter);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
};

module.exports = { paginateQuery };
