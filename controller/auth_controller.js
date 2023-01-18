const userModel = require("../Model/user");
const userList = require("../Model/user_list");
const jwt = require("jsonwebtoken");
const { CustomError } = require("../middleware/Error");
const login_handler = async (req, res, next) => {
    const { email, pass } = req.body;

    try {
        //* if user passess an empty email value check it.
        //* if it is empty then throw a Empty email error in the client
        if (!email) {
            throw new CustomError("Please provide an email", "EmptyEmail");
        }

        //* if user passess an empty password value check it.
        //* if it is empty then throw a Empty password error in the client

        if (!pass) {
            throw new CustomError("Please provide a password", "EmptyPassword");
        }

        //* query if the user exist or not
        const userData = await userModel.findOne({ email: email });

        if (!userData)
            throw new CustomError("Incorrect Email or Password", "NoAccount");

        //* user found. so check compare it's password
        const isPasswordSimilar = await userData.comparePassword(pass);

        if (!isPasswordSimilar)
            throw new CustomError("Incorrect Email or Password", "NoAccount");

        //* if authentication successful then return token
        const token = userData.getToken();
        return res
            .status(200)
            .send({ messages: "Successfully signed in", token });
    } catch (error) {
        //* any other error then pass it in the middleware
        next(error);
    }
};

const newUser_handler = async (req, res, next) => {
    const { name, email, pass } = req.body;

    try {
        if (!name) {
            throw new CustomError(
                "Please provide an user name",
                "EmptyUsername"
            );
        }
        //* if user passess an empty email value check it.
        //* if it is empty then throw a Empty email error in the client
        if (!email) {
            throw new CustomError("Please provide an email", "EmptyEmail");
        }

        //* if user passess an empty password value check it.
        //* if it is empty then throw a Empty password error in the client

        if (!pass) {
            throw new CustomError("Please provide a password", "EmptyPassword");
        }
        const user = await userModel.create({
            name,
            email,
            password: pass,
            image: `${
                req.headers["x-forwarded-proto"] || "http"
            }://${req.header("Host")}/public/default-profile.jpg`,
        });

        const token = user.getToken();
        res.status(201).json({ message: "User created successfully!", token });
    } catch (error) {
        //* whatever error is coming from mongoose , pass it in the express error handling middleware
        next(error);
    }
};

const authorizeUser = async (req, res) => {
    //* get the token from client side
    const userToken = req.headers.authorization;
    if (!userToken || !userToken.startsWith("Bearer")) {
        //! if no token received then show error
        return res.status(401).send({ message: "No access token provided" });
    }

    try {
        //* verify the user with that token
        const { name, userID } = jwt.verify(
            userToken.split(" ")[1],
            process.env.JWT_SECRET
        );

        res.status(200).json({ userID, name });
    } catch (error) {
        res.status(401).send({ message: "Not authorized" });
    }
};

module.exports = { login_handler, newUser_handler, authorizeUser };
