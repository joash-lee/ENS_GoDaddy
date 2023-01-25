const { expect } = require("chai");
const { base58 } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("ETHDaddy", () => {
  let ethDaddy;
  const NAME = "ETH Daddy";
  const SYMBOL = "ETHD";

  beforeEach(async () => {
    [deployer, owner1] = await ethers.getSigners();

    const ETHDaddy = await ethers.getContractFactory("ETHDaddy");
    ethDaddy = await ETHDaddy.deploy("ETH Daddy", "ETHD");

    const transaction = await ethDaddy
      .connect(deployer)
      .list("jack.eth", tokens(10));
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("has a name", async () => {
      const result = await ethDaddy.name();
      expect(result).to.equal(NAME);
    });
    it("has a symbol", async () => {
      const result = await ethDaddy.symbol();
      expect(result).to.equal(SYMBOL);
    });
    it("sets the owner", async () => {
      const result = await ethDaddy.owner();
      expect(result).to.equal(deployer.address);
    });
    it("returns the maxmimum supply", async () => {
      const result = await ethDaddy.maxSupply();
      expect(result).to.equal(1);
    });
    it("returns the total supply", async () => {
      const result = await ethDaddy.totalSupply();
      expect(result).to.equal(0);
    });
  });

  describe("Domain", () => {
    it("returns domain attributes", async () => {
      let domain = await ethDaddy.getDomain(1);
      expect(domain.name).to.be.equal("jack.eth");
      expect(domain.cost).to.be.equal(tokens(10));
      expect(domain.isOwned).to.be.equal(false);
    });
  });
  describe("Minting", () => {
    const ID = 1;
    const AMOUNT = ethers.utils.parseUnits("10", "ether");

    beforeEach(async () => {
      const transaction = await ethDaddy
        .connect(owner1)
        .mint(ID, { value: AMOUNT });
      await transaction.wait();
    });

    it("updates the owner", async () => {
      const owner = await ethDaddy.ownerOf(ID);
      expect(owner).to.be.equal(owner1.address);
    });

    it("updates the domain status", async () => {
      const domain = await ethDaddy.getDomain(ID);
      expect(domain.isOwned).to.be.equal(true);
    });

    it("updates the contract balance", async () => {
      const result = await ethDaddy.getBalance();
      expect(result).to.be.equal(AMOUNT);
    });
  });
  describe("Withdrawing", () => {
    const ID = 1;
    const AMOUNT = ethers.utils.parseUnits("10", "ether");
    let balanceBefore;

    beforeEach(async () => {
      balanceBefore = await ethers.provider.getBalance(deployer.address);

      let transaction = await ethDaddy
        .connect(owner1)
        .mint(ID, { value: AMOUNT });
      await transaction.wait();

      transaction = await ethDaddy.connect(deployer).withdraw();
      await transaction.wait();
    });

    it("updates the owner balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("updates the contract balance", async () => {
      const result = await ethDaddy.getBalance();
      expect(result).to.equal(0);
    });
  });
});
