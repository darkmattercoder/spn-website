"use strict";

function GameVisualization(assets, snakeMoveStrategy, container)
{
    this.container = container;
    this.snakeMoveStrategy = snakeMoveStrategy;
    this.snakes = {};
    this.ego_id = 0;
    this.follow_db_id = null;
    this.nextFoodDecayRow = 0;
    this.world_size_x = 1024;
    this.world_size_y = 1024;
    this.food_decay_rate = 0.001;

    this.colorSchemes = [
        [ 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xA00000, 0xA00000, 0xA00000, 0xA00000 ],
        [ 0x00FF00, 0x00FF00, 0x00FF00, 0x00FF00, 0x00A000, 0x00A000, 0x00A000, 0x00A000 ],
        [ 0x0000FF, 0x0000FF, 0x0000FF, 0x0000FF, 0x0000A0, 0x0000A0, 0x0000A0, 0x0000A0 ],
        [ 0xFF0000, 0xFF0000, 0x444444 ],
        [ 0x444444, 0x444444, 0x444444, 0x444444, 0x444444, 0x444444, 0x444444, 0x444444, 0x444444, 0x444444, 0x00FF00 ],
        [ 0xFFBA00, 0xFFBA00, 0xFFBA00, 0x555555, 0x555555, 0x555555, 0x555555, 0x555555, 0x555555, 0x555555, 0x555555, 0x555555, 0x555555 ],
        [ 0xAAAAAA, 0x999999, 0x888888, 0x777777, 0x666666, 0x555555, 0x444444, 0x555555, 0x666666, 0x777777, 0x888888, 0x999999 ],
        [ 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFF0000, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF,  ],
    ];

    this.app = new PIXI.Application({'transparent':true});
    this.app.stage.interactiveChildren = false;

    this.txHead = PIXI.Texture.fromImage(assets['head.png']);
    this.txBody = PIXI.Texture.fromImage(assets['body.png']);
    this.txFood = PIXI.Texture.fromImage(assets['food.png']);

    this.mainStage = new PIXI.Container();
    this.app.stage.addChild(this.mainStage);
}

GameVisualization.prototype.Run = function()
{
    this.container.appendChild(this.app.view);
    this.Resize();
    this.app.ticker.add(this.GameTick, this);
};

GameVisualization.prototype.Resize = function()
{
    this.GetRenderer().resize(this.container.clientWidth, this.container.clientHeight);
};

GameVisualization.prototype.GetRenderer = function()
{
    return this.app.renderer;
}

GameVisualization.prototype.GameTick = function(delta)
{
    this.UpdateStagePosition();
};

GameVisualization.prototype.CreateSnake = function(bot)
{
    if (bot.db_id == this.follow_db_id)
    {
        this.ego_id = bot.id;
    }
    let snake = new Snake(this.txHead, this.txBody, bot.color, this.world_size_x, this.world_size_y);
    snake.snake_id = bot.id;
    snake.db_id = bot.db_id;
    this.snakes[bot.id] = snake;
    this.mainStage.addChild(snake.Container);
    return snake;
};

GameVisualization.prototype.RemoveSnake = function(id)
{
    if (id in this.snakes)
    {
        this.mainStage.removeChild(this.snakes[id].Container);
        delete this.snakes[id];
    }
};

GameVisualization.prototype.HandleGameInfoMessage = function(world_size_x, world_size_y, food_decay_rate)
{
    this.world_size_x = world_size_x;
    this.world_size_y = world_size_y;
    this.food_decay_rate = food_decay_rate;
    this.foodMap = new ParticleGeoMap(this.world_size_x, this.world_size_y, 64, 64);
    this.app.stage.addChildAt(this.foodMap.Container, 1);
};

GameVisualization.prototype.HandleTickMessage = function(frame_id)
{
    for (let snake_id in this.snakes)
    {
        this.snakes[snake_id].AnimateEat();
    }

    this.foodMap.IterateRow(this.nextFoodDecayRow++, function(food) {
        food.Decay(32);
    }, this);
    this.foodMap.IterateRow(this.nextFoodDecayRow++, function(food) {
        food.Decay(32);
    }, this);
    this.nextFoodDecayRow %= 64;
};

GameVisualization.prototype.HandlePlayerInfoMessage = function(player_id)
{
};

GameVisualization.prototype.HandleWorldUpdateMessage = function(data)
{
    for (let id in data.bots)
    {
        let bot = data.bots[id];
        if (!(bot.id in this.snakes))
        {
            this.CreateSnake(bot);
        }
        this.snakes[bot.id].SetData(bot);
    }

    for (let id in this.snakes)
    {
        if (!(id in data.bots))
        {
            this.RemoveSnake(id);
        }
    }

    for (let id in data.food)
    {
        let food = data.food[id];
        this.foodMap.AddSprite(new FoodSprite(this.txFood, this.food_decay_rate, food.id, food.pos_x, food.pos_y, food.value));
    }
};

GameVisualization.prototype.HandleBotSpawnMessage = function(bot)
{
    this.CreateSnake(bot);
};

GameVisualization.prototype.HandleBotKilledMessage = function(killer_id, victim_id)
{
    this.RemoveSnake(victim_id);
};

GameVisualization.prototype.HandleFoodSpawnMessage = function(food_id, pos_x, pos_y, value)
{
    this.foodMap.AddSprite(new FoodSprite(this.txFood, this.food_decay_rate, food_id, pos_x, pos_y, value));
};

GameVisualization.prototype.HandleFoodConsumedMessage = function(food_id, consumer_id)
{
    let sprite = this.foodMap.RemoveItem(food_id);
    if (sprite)
    {
        this.snakes[consumer_id].Eat(sprite);
    }
};

GameVisualization.prototype.HandleFoodDecayedMessage = function(food_id)
{
    this.foodMap.RemoveItem(food_id);
};

GameVisualization.prototype.HandleBotMovedMessage = function(bot_id, segment_data, length, segment_radius)
{
    if (bot_id in this.snakes)
    {
        this.snakeMoveStrategy.OldStyleMove(this.snakes[bot_id], segment_data, length, segment_radius);
        this.snakes[bot_id].UpdateHead();
    }
};

GameVisualization.prototype.HandleBotMoved2Message = function(bot_id, heading, speed, length, segment_radius)
{
    if (bot_id in this.snakes)
    {
        this.snakeMoveStrategy.NewStyleMove(this.snakes[bot_id], heading, speed, length, segment_radius);
        this.snakes[bot_id].UpdateHead();
    }
};

GameVisualization.prototype.HandleBotMovedMessagesDone = function(data)
{
    this.HandleTickMessage();
    this.UpdateStagePosition();
};

GameVisualization.prototype.FollowDbId = function(db_id)
{
    this.follow_db_id = db_id;
    for (let id in this.snakes)
    {
        if (this.snakes[id].db_id == db_id)
        {
            this.ego_id = id;
        }
    }
}

GameVisualization.prototype.UpdateStagePosition = function()
{
    if (this.ego_id in this.snakes)
    {
        let egoSnake = this.snakes[this.ego_id];
        let egoX = egoSnake.GetHeadX();
        let egoY = egoSnake.GetHeadY();

        let transX = (this.app.renderer.width/2) - egoX;
        let transY = (this.app.renderer.height/2) - egoY;
        this.app.stage.setTransform(transX, transY);
        if (this.foodMap)
        {
            this.foodMap.Update(egoX, egoY, this.app.renderer.width, this.app.renderer.height);
        }
    } else {
        this.app.stage.setTransform(0,0);
        if (this.foodMap)
        {
            this.foodMap.Update(this.world_size_x/2, this.world_size_y/2, this.world_size_x, this.world_size_y);
        }
    }
};
