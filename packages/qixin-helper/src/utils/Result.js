class Result {
    type
    msg
    data

    constructor(type, msg, data) {
        this.type = type;
        this.msg = msg;
        this.data = data;
    }

    isSuccess() {
        return Result.SUCCESS === this.type;
    }

    isError() {
        return Result.ERROR === this.type;
    }

    static SUCCESS = "success"
    static WARNING = "warning"
    static ERROR = "error"
    static INFO = "info"

    static success(msg) {
        return this.builder().type(Result.SUCCESS).msg(msg)
    }

    static warning(msg) {
        return this.builder().type(Result.WARNING).msg(msg)
    }

    static error(msg) {
        return this.builder().type(Result.ERROR).msg(msg)
    }

    static info(msg) {
        return this.builder().type(Result.INFO).msg(msg)
    }

    static builder() {
        return {
            type(type) {
                this.typeParam = type
                return this
            },
            msg(msg) {
                this.msgParam = msg
                return this
            },
            data(data) {
                this.dataParam = data
                return this
            },
            build() {
                return new Result(this.typeParam, this.msgParam, this.dataParam)
            }
        }
    }

}

export default Result