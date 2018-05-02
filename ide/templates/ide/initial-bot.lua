--- WELCOME TO YOUR FIRST SNAKE!
-- you can edit this code, save and run it.

-- you should see log output at the bottom of this page,
-- and a live view on your snake's wellbeing on the right

--- init() is called once upon creation of the bot
-- initialize your data here, and maybe set colors for your snake
function init()
    self.colors = { 0xFF0000, 0x808080 }
end

--- step() is called once every frame, maybe up to 60 times per second.
-- implement your game logic here.
-- after deciding what your bot should do next,
-- just return the desired steering angle.
-- a negative angle means turn left and a positive angle means turn right.
-- with 0, the snake keeps its current direction.
function step()
    -- there is some info in the "self" object, e.g. your current head/segment radius
    local own_radius = self.r

    -- your snake needs food to grow
    -- to find food in your head's surroundings, call something like that:
    local food = findFood(100, 0.8)
    -- this will give you all food in maximum distance of 100 around your head,
    -- with a mass of at least 0.8

    -- you can iterate over the result:
    for i, item in food:pairs() do

        -- distance of the food item, relative to the center of your head
        local distance = item.dist

        -- direction to the food item, in radiens (0..2*math.pi)
        -- 0 means "straight ahead", math.pi means "right behind you"
        local direction = item.d

        -- mass of the food item. you will grow this amount if you eat it.
        -- realistic values are 0 - 4
        local value = item.v

	end

    -- you should also look out for your enemies.
    -- to find snake segments around you, call:
    local segments = findSegments(100, false)

    -- in return, you get a list of
    -- all snake segments nearer than 100 to your head,
    -- in this case not including your own segments:
    for i, item in segments:pairs() do

        -- id of the bot the segment belongs to
        -- (you can compare this to self.id)
        local bot = item.bot

        -- distance to the center of the segment
        local distance = item.dist

        -- direction to the segment, in radiens (0..2*math.pi)
        local direction = item.d

        -- radius of the segment
        local radius = item.r

        if distance<10 then
            -- you can send some log output to the web IDE, but it's rate limited.
            log(string.format("oh no, i'm going to die. distance: %.4f!", distance))
        end
	end

    return 0.002 -- this will lead us in a large circle, clockwise.
end