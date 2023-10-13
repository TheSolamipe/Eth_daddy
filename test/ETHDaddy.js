const { expect } = require("chai");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("ETHDaddy", () => {
  let ethDaddy;
  let deployer, owner1;

  const NAME = "ETH Daddy";
  const SYMBOL = "ETHD";

  beforeEach(async () => {
    // setup accounts
    [deployer, owner1] = await ethers.getSigners();

    // deploy contract
    const ETHDaddy = await ethers.getContractFactory("ETHDaddy");
    ethDaddy = await ETHDaddy.deploy("ETH Daddy", "ETHD");

    // List a domain
    const transaction = await ethDaddy
      .connect(deployer)
      .list("jack.eth", tokens(10));
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("has a name", async () => {
      const resultingName = await ethDaddy.name();
      expect(resultingName).to.equal(NAME);
    });

    it("has a symbol", async () => {
      const resultingSymbol = await ethDaddy.symbol();
      expect(resultingSymbol).to.equal(SYMBOL);
    });

    it("sets the owner", async () => {
      const resultingOwner = await ethDaddy.owner();
      expect(resultingOwner).to.equal(deployer.address);
    });

    it("Returns max supply", async () => {
      const result = await ethDaddy.maxSupply();
      expect(result).to.equal(1);
    });

    it("Returns total supply", async () => {
      const result = await ethDaddy.totalSupply();
      expect(result).to.equal(0);
    });
  });

  describe("Domain", () => {
    it("Returns domain attributes", async () => {
      let domain = await ethDaddy.getDomain(1);
      expect(domain.name).to.be.equal("jack.eth");
      expect(domain.cost).to.be.equal(tokens(10));
      expect(domain.isOwned).to.be.equal(false);
    });
  });

  describe("Minting", () => {
    const ID = 1;
    const AMOUNT = tokens(10);

    beforeEach(async () => {
      const transaction = await ethDaddy
        .connect(owner1)
        .mint(ID, { value: AMOUNT });
      await transaction.wait();
    });

    it("Updates the owner", async () => {
      const owner = await ethDaddy.ownerOf(ID);
      expect(owner).to.be.equal(owner1.address);
    });

    it("Updates the domain status", async () => {
      const domain = await ethDaddy.getDomain(ID);
      expect(domain.isOwned).to.be.equal(true);
    });

    it("Updates the contract balance", async () => {
      const result = await ethDaddy.getBalance();
      expect(result).to.be.equal(AMOUNT);
    });

    it("Updates total supply", async () => {
      const result = await ethDaddy.totalSupply();
      expect(result).to.equal(1);
    });
  });

  describe("Withdrawal", () => {
    let initialBalance = 0;
    const ID = 1;
    const AMOUNT = tokens(10);

    beforeEach(async () => {
      initialBalance = await deployer.getBalance();

      let transaction = await ethDaddy
        .connect(owner1)
        .mint(ID, { value: AMOUNT });
      await transaction.wait();

      transaction = await ethDaddy.connect(deployer).withdraw();
      await transaction.wait();
    });

    it("Updates the contract balance", async () => {
      const balance = await ethDaddy.getBalance();
      expect(balance).to.be.equal(0);
    });

    it("Updates creator balance", async () => {
      const result = await deployer.getBalance();
      expect(result).to.be.greaterThan(initialBalance);
    });
  });
});
