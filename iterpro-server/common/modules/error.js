module.exports = {
	/** create an error with 400 status code and a default text if not provided */
	BadRequestError: function (message = 'Bad Request') {
		const error = new Error(message);
		error.statusCode = 400;
		return error;
	},
	/** create an error with 401 status code and a default text if not provided */
	AuthorizationError: function (message = 'Not authorized') {
		const error = new Error(message);
		error.statusCode = 401;
		return error;
	},
	/** create an error with 403 status code and a default text if not provided */
	ForbiddenError: function (message = 'Forbidden', source) {
		const error = new Error(message);
		error.statusCode = 403;
		if (source) error.source = source;
		return error;
	},
	/** create an error with 404 status code and a default text if not provided */
	NotFoundError: function (message = 'Not found') {
		const error = new Error(message);
		error.statusCode = 404;
		return error;
	},
	/** create an error with 409 status code and a default text if not provided */
	ConflictError: function (message = 'Resource Conflict') {
		const error = new Error(message);
		error.statusCode = 409;
		return error;
	},
	/** create an error with 422 status code and a default text if not provided */
	UnprocessableEntityError: function (message = 'Unprocessable entity error') {
		const error = new Error(message);
		error.statusCode = 422;
		return error;
	},
	/** create an error with 500 status code and a default text if not provided */
	InternalError: function (message = 'Internal server error', source) {
		const error = new Error(message);
		error.statusCode = 500;
		if (source) error.source = source;
		return error;
	},
	/** from axios error */
	FromAxiosError: function (axiosError) {
		const error = new Error(axiosError.message);
		error.statusCode = axiosError.response?.status || 500;
		return error;
	},
	/** error with custom or unknown code (default 500) */
	CustomError: function (message, statusCode = 500) {
		const error = new Error(message);
		error.statusCode = statusCode;
		return error;
	},
	/** @see Event.js
	 * @param err: instance Error
	 *
	 * prints to console.error and throws error
	 */
	EventError: function (err) {
		// print error to standard console
		console.error(err);
		const error = new Error(err.message);
		error.statusCode = err.statusCode || '500';
		error.code = 'EVENT_ERROR';
		error.name = 'EventError';
		return error;
	},
	// @see common/models/scouting-game.js
	SendEmailError(error, msgs) {
		if (error.code === 400) {
			msgs.forEach(msg => {
				if (msg.cc.some(x => x.email === msg.from || x.email === msg.to) || msg.to === msg.from) {
					error.message = 'Emails must be inserted once (TO, FROM, CC may have the same email)';
				}
			});
		}
		return error;
	}
};
