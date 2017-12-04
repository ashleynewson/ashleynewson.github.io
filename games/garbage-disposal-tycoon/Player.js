function Player() {
    this.money = 0;
}

Player.prototype.fund = function(quantity) {
    this.money += quantity;
}

Player.prototype.withdraw = function(quantity) {
    if (this.money < quantity) {
        return false;
    } else {
        this.money -= quantity;
        return true;
    }
}
