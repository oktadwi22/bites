import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import Link from "next/link";
import { abis } from "@/utils/abi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { erc20ABI, useAccount } from "wagmi";
import { formatEther, parseEther, formatUnits } from "viem";
import {
  fetchBalance,
  multicall,
  readContract,
  prepareWriteContract,
  waitForTransaction,
  WriteContractArgs,
  writeContract
} from '@wagmi/core'
import toast from "react-hot-toast";
import { getData } from "@/libs/gas";
import { sha256 } from 'js-sha256';

import { AnimatePresence, motion } from "framer-motion";
import H1 from "@/component/element/H1";
import ComponentTransition from "@/component/element/ComponentTransition";
import { FaEthereum } from "react-icons/fa6";
import { HiEllipsisVertical } from "react-icons/hi2";
import { RiDownloadLine } from "react-icons/ri";
import { GoPlus } from "react-icons/go";
import { GrFormClose, GrFormSubtract } from "react-icons/gr";
import ButtonIcon from "@/component/element/ButtonIcon";
import { CiBitcoin } from "react-icons/ci";


export default function Home() {

  const [tokenAddress] = useState<`0x${string}`>(
    "0xcd152e2a8c19bbfc2c89c5d9b19e53ab17a29b2a"
  );

  const [SC1] = useState<`0x${string}`>(
    "0xde555202382bffd277a0cf44ce8804c16ba6374f"
  );

  const [SC2] = useState<`0x${string}`>(
    "0xf0a7f19D5cF52bBE5D114fDA1f7B667AE49308F8"
  );

  // NOTE / This is an import from the previous migration
  const [open, setOpen] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [choice, setChoice] = useState<boolean>(false);

  const [chainId] = useState(1);
  const [tvl, setTVL] = useState("");
  const [Pool, setPool] = useState("");
  const [inputAmount, setInputAmount] = useState("");
  const [yourStaked, setYourStaked] = useState("");
  const [yourReward, setYourReward] = useState("");

  const [balance, setBalance] = useState("");
  const { address, isConnected } = useAccount();
  const [disableWallet, setDisableWallet] = useState(false);
  const [gas, setGas] = useState<string | null>(null);
  const [yourLastDeposit, setYourLastDeposit] = useState("");


  const getBalance = async (address: any) => {
    try {

      const { formatted } = await fetchBalance({
        address,
        chainId,
        token: tokenAddress,
      })
      setBalance(formatted)

    } catch (error) {
      console.log(error)
    }
  }

  const getDataInnfo = async (address: any) => {
    try {

      const token = {
        address: tokenAddress,
        abi: erc20ABI,
      };

      const sc = {
        address: SC1,
        abi: abis,
      };

      const UserInfo = await multicall({
        chainId,
        contracts: [
          {
            ...sc,
            functionName: 'userInfo',
            args: [address]
          },
          {
            ...sc,
            functionName: 'claimableReward',
            args: [address]
          }
        ]
      });

      const stakingData = await multicall({
        chainId,
        contracts: [
          {
            ...token,
            functionName: 'balanceOf',
            args: [SC1]
          },
          {
            ...sc,
            functionName: 'totalStaked',
            args: [SC1]
          }
        ]
      });

      setYourStaked(formatEther((UserInfo[0].result as bigint[])[0] as bigint))
      setYourReward(formatEther(UserInfo[1].result as bigint))
    } catch (error) {
      console.log(error)
    };
  }

  const changeInput = (e: any) => {
    const input = e.target.value;
    const lastKey = input[input.length - 1];

    if (!isNaN(input)) {
      setInputAmount(input);
    } else if (lastKey === ",") {
      if (!input.includes(".")) {
        if (input.length === 1) {
          const newInput = "0" + ".";
          setInputAmount(newInput);
        } else {
          const newInput = input.slice(0, -1) + ".";
          setInputAmount(newInput);
        }
      }
    } else if (lastKey === "." && input.length === 1) {
      setInputAmount("0" + lastKey);
    }
  };

  const approve = async (_inputAmount: any) => {
    try {
      const sendTx = async () => {
        const { hash } = await writeContract({
          address: tokenAddress,
          abi: erc20ABI as never,
          functionName: "approve" as never,
          args: [SC1, parseEther(balance)],
          account: `0x${address}`
        });

        await waitForTransaction({ chainId, hash });
        stake(SC1, _inputAmount);

      };

      toast.promise(sendTx(), {
        loading: "Approving...",
        success: <b>Approve Successful !</b>,
        error: <b>Approve Failed !</b>,
      },
        {
          success: {
            duration: 8000
          },
          error: {
            duration: 15000
          },
        });
    } catch (error) {
      console.log(error);
    }
  };

  const stake = async (ca: any, _inputAmount: any) => {
    try {
      if (Number(_inputAmount) <= Number(balance)) {
        const sendTx = async () => {
          const { hash } = await writeContract({
            address: ca,
            abi: abis as never,
            functionName: "stake" as never,
            args: [parseEther(_inputAmount), address],
            account: `0x${address}`,
          });

          await waitForTransaction({ chainId, hash });

          reload();
        };

        toast.promise(sendTx(), {
          loading: "Staking...",
          success: <b>Stake Successful !</b>,
          error: <b>Stake Failed !</b>,
        }, {
          success: {
            duration: 8000
          },
          error: {
            duration: 15000
          },
        });

      } else {
        toast.error("Insufficient balance !");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkAllowance = async (ca: any, _inputAmount: any) => {
    try {
      const allowance = await readContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: "allowance",
        args: [`0x${address}`, ca],
      });

      if (formatEther(allowance as bigint) < _inputAmount) {
        approve(ca);
      } else {
        stake(ca, _inputAmount);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const unstake = async (ca: any, _tokenAddress: any, _yourStaked: any, _last: any) => {

    try {
      const sendTx = async () => {
        const { hash } = await writeContract({
          address: ca,
          abi: abis as never,
          functionName: "unstake" as never,
          args: [parseEther(_yourStaked), address],
          account: `0x${address}`
        });

        await waitForTransaction({ chainId, hash });
        reload();
      };

      toast.promise(sendTx(), {
        loading: "Unstaking...",
        success: <b>Unstake Successful !</b>,
        error: <b>You have't staked !</b>,
      },
        {
          success: {
            duration: 8000
          },
          error: {
            duration: 15000
          },
        });

    } catch (error) {
      console.log(error);
    }
  };


  // NOTE / This is an import from the previous migration
  const handleOpen = (index: number) => {
    setOpen(open === index ? null : index);
  };

  const handleOpenModal = (index: number) => {
    setOpenModal(true);
    setSelectedItem(index);
  };

  const reload = async () => {

  }


  return (
    <>
      <Head>
        <title>Bit Estate</title>
        <meta name="description" content="
        Cloud Servers For Your Decentralized Application and AI Machine Learning Application."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={`sm:py-1 md:py-3 my-2 -mx-2 py-2 px-2 w-[99.6vw] sm:px-5 justify-between flex items-center`}>
        <div className={styles.navlogo}>
          <Image
            src="/logoNavbar.png"
            alt="AI"
            width="200"
            height="200"
            priority={true}
            className="w-[25vw] sm:w-[30vw] md:w-[15vw] lg:w-[16vw]"
          />
        </div>
        <div className={`!w-full  ${styles.navlinks}`}>
          {!disableWallet && (
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks

                const ready = mounted && authenticationStatus !== "loading";
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === "authenticated");

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button className="px-2 py-[0.4rem] md:py-2 flex items-center mr-10 md:mr-20 hover:transition duration-[0.8s] hover:duration-[0.3s] ring-white ring-1 hover:ring-blue-300 hover:shadow-md hover:shadow-blue-300 "

                            onClick={openConnectModal}
                            type="button"
                            style={{
                              alignItems: "center",
                              fontWeight: "600",
                              borderRadius: "13px",
                              marginLeft: "13px",

                            }}
                          >
                            <Image
                              src="/wallet.png"
                              alt="AI"
                              width="30"
                              height="30"
                              className="invert pr-1 pb-1 w-5 md:w-7 lg:w-8"
                            />
                            <h1 className="text-[10px] md:text-sm">CONNECT</h1>

                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button onClick={openChainModal} type="button">
                            {" "}
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: 12,

                          }}
                        >

                          <button className="px-2 py-2 sm:flex hidden justify-center items-center hover:transition duration-[0.8s] hover:duration-[0.3s] ring-white ring-1 hover:ring-blue-300 hover:shadow-md hover:shadow-blue-300"

                            onClick={openChainModal}
                            style={{

                              alignItems: "center",
                              borderRadius: "13px",
                              color: "#ffff",

                            }}
                            type="button"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 20,
                                  height: 20,
                                  borderRadius: 999,
                                  overflow: "hidden",
                                  marginRight: "3px",
                                }}
                              >
                                {chain.iconUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    alt={chain.name ?? "Chain icon"}
                                    src={chain.iconUrl}
                                    style={{ width: 35, height: 20 }}
                                  />
                                )}
                              </div>
                            )} <span className="text-sm">
                              {chain.name}</span>

                          </button>

                          <button className="flex mr-2 px-2 py-2  items-center hover:transition duration-[0.8s] hover:duration-[0.3s] ring-white ring-1 hover:ring-blue-300 hover:shadow-md hover:shadow-blue-300"

                            onClick={openAccountModal}
                            type="button"
                            style={{
                              alignItems: "center",
                              fontWeight: "600",
                              borderRadius: "13px",
                              marginLeft: "13px",
                            }}
                          >
                            <Image
                              src="/wallet.png"
                              alt="AI"
                              width="30"
                              height="30"
                              className="invert md:pr-1 w-5 md:w-6"
                            />
                            <div className="px-1 hidden sm:block">
                              {account.displayName}
                            </div>

                          </button>
                          <a href="https://etherscan.io/gastracker"
                            className="px-2 py-2 flex items-center ring-1 ring-blue-200 shadow-md shadow-blue-200"
                            type="button"
                            style={{
                              alignItems: "center",
                              fontWeight: "600",
                              borderRadius: "13px"
                            }}
                          >
                            <Image
                              src="/gas.svg"
                              alt="AI"
                              width="20"
                              height="20"
                              className="invert w-4  "
                            />
                            <h1 className="text-[10px] md:text-[14px] pl-1 ">
                              {gas}
                            </h1>
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          )}
        </div>
      </div>

      {/* Migration From previous code */}

      <main className="w-full justify-center items-center">
        <div className="w-full justify-center items-center">
          <div className="h-auto  mx-auto max-w-[1500px] items-center flex flex-col  justify-center px-5 lg:px-10 mt-32  w-full  overflow-hidden">
            <div className="w-full lg:py-10 lg:px-10">
              <H1
                title="Staking"
                textColor="white"
                className="text-3xl font-semibold"
              />
            </div>
            <div className="w-full overflow-hidden">
              <ComponentTransition className="w-full flex flex-col gap-5 justify-start  items-start">

                <motion.div className={
                  ` w-full transition-all duration-300  relative top-0 bg-gradient-to-b from-[#1F1F1F] to-neutral-800 px-5 py-5 rounded-3xl flex-col flex justify-between items-center `
                }>
                  <motion.div className={(`absolute inset-0 glowcard z-0 rounded-3xl`)}></motion.div>
                  <div className="w-full lg:flex-row px-4 flex-col flex justify-between gap-10 relative hover:cursor-pointer"
                    onClick={() => stake(SC1, inputAmount)}
                  >
                    <div
                      className={`flex items-center justify-between gap-3 lg:gap-10 `}

                    >
                      <div className="flex items-center">
                        <Image
                          className="w-[40%] sm:w-[60%] pr-2 sm:pr-0 h-auto"
                          src={'/COIN.png'}
                          alt="Coin Bit Estate"
                          width={40}
                          height={40}
                        />
                        <FaEthereum size={40} />
                        <div className=" w-full px-3 flex sm:hidden items-center">
                          <h1 className="text-lg font-[800]">
                            BITES - ETH
                          </h1>
                        </div>
                      </div>
                      <div className="sm:flex hidden items-center">
                        <h1 className="text-xl font-semibold">
                          BITES - ETH
                        </h1>
                      </div>

                      {/* Button More Dekstop */}
                      <div className="flex lg:hidden justify-start items-center relative  ">
                        <div className="'m-auto transition-transform">
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </div>
                      </div>

                    </div>
                    <div className={`flex justify-between px-2 md:gap-28 items-center`}>
                      <div>
                        <h1 className="font-[700]">Earned</h1>
                        <h1 className="text-lg font-semibold text-[#01a2e9]">
                          1000.00
                        </h1>
                      </div>
                      <div className="">
                        <h1 className="font-[700]">APR</h1>
                        <h1 className="font-[600]">100%</h1>
                      </div>
                      <div>
                        <h1 className="font-[700]">Reward</h1>
                        <h1 className="font-[600]">$10000</h1>
                      </div>
                    </div>
                    <div className={`hidden lg:flex gap-1 items-center `}>
                      <div className="w-full flex items-center ">
                        <div className="'m-auto transition-transform">
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full border-t-2 mt-5 lg:flex-row flex-col gap-6 py-6">
                    <div className="w-full lg:w-1/3 px-4 ">
                      <div className="rounded-xl border border-[#524b63] p-4">
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-400"

                            >STAKED</span>
                            <span>
                              00.00
                            </span>

                          </div>
                          <div className="flex gap-2">
                            <button
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-bold uppercase transition duration-150 ease-in-out hover:opacity-90 active:bg-blue-600"

                            >
                              -
                            </button>

                            <button
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-bold uppercase transition duration-150 ease-in-out hover:opacity-90 active:bg-blue-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full lg:w-1/3 px-4 ">
                      <div className="rounded-xl border border-[#524b63] p-4">
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-400"

                            >EARNED</span>
                            <span>
                              00.00
                            </span>
                          </div>
                          <div className="flex flex-col justify-around gap-2">
                            <button
                              className="flex items-center justify-center rounded-xl bg-blue-500 px-6 py-2 font-bold uppercase transition duration-150 ease-in-out hover:opacity-90 active:bg-blue-600 disabled:bg-gray-500"
                              onClick={() => unstake(SC1, inputAmount, yourLastDeposit, yourLastDeposit)}
                            >
                              Harvest
                            </button>

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </motion.div>


                <div className="">
                  <AnimatePresence>
                    {openModal && (
                      <motion.div
                        initial={{
                          translateY: 50,
                          scale: 0.70,
                          opacity: 0,
                        }}
                        animate={{
                          translateY: 0,
                          scale: 1,
                          opacity: 1
                        }}
                        exit={{
                          translateY: 50,
                          scale: 0.70,
                          opacity: 0
                        }}
                        className="w-[80%] md:w-[60%] xl:w-[50%] left-[10%] 2xl:w-[25%] mx-auto rounded-3xl flex  inset-44  h-[400px]  bg-neutral-900 fixed z-[999]">
                        <div className="w-full justify-center items-center py-2 ">
                          <button
                            className=" w-auto flex items-end justify-end relative left-[80%] 2xl:left-[90%]"
                            onClick={() => setOpenModal(!openModal)}
                          >
                            <GrFormClose size={50} />
                          </button>
                          <div className="w-auto flex justify-center items-center py-2">
                            <div className="w-auto px-1 py-1 bg-[#3f3f3f88] rounded-2xl flex gap-2 overflow-hidden">
                              <button
                                onClick={() => setChoice(!choice)}
                                className={
                                  `${choice === false && "bg-[#01a2e9]"} text-white px-3 py-2 rounded-[12px] transition-all duration-300`
                                }
                              >
                                <h1>Stake</h1>
                              </button>
                              <button
                                onClick={() => setChoice(!choice)}
                                className={
                                  `${choice === true && "bg-[#01a2e9]"} text-white px-3 py-2 rounded-[12px] transition-all duration-300`
                                }
                              >
                                <h1>Withdraw</h1>
                              </button>
                            </div>
                          </div>

                          <div className="w-full flex justify-center items-center px-10 py-5">
                            <div className="flex flex-row flex-wrap w-full justify-between items-center">
                              <div className="flex items-center gap-1">

                                <Image
                                  className="w-full h-auto"
                                  src={'/COIN.png'}
                                  alt="Coin Bit Estate"
                                  width={20}
                                  height={20}
                                />

                                <h1 className="text-lg font-semibold">

                                </h1>
                              </div>
                              <div>Balance:
                                {balance ? (
                                  Number(balance).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                ) : (
                                  '0.00 $BITES'
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="w-full flex justify-center items-center px-10">
                            <input
                              type="number"
                              className="w-full bg-transparent border-[1px] py-2 rounded-2xl px-2"
                              placeholder="0.0"
                            />
                          </div>
                          {/*<div className="w-full flex justify-end items-end px-10 gap-3 mt-2">
                            <div className="px-2 border-[1px] border-[#01a2e9] rounded-full">
                              <h1>20%</h1>
                            </div>
                            <div className="px-2 border-[1px] border-[#01a2e9] rounded-full">
                              <h1>50%</h1>
                            </div>
                            <div className="px-2 border-[1px] border-[#01a2e9] rounded-full">
                              <h1>90%</h1>
                            </div>
                          </div>*/}

                          <div className="w-full flex justify-center items-center px-10 py-10">
                            {/* Stake & Withdraw Button Logic */}

                            {choice === false ? (
                              <motion.button
                                className="px-5 py-2 bg-[#01a2e9] rounded-2xl w-full"
                                whileTap={{
                                  scale: 0.9,
                                }}
                              >
                                <h1 className="text-white font-semibold">Stake</h1>
                              </motion.button>
                            ) : (
                              <motion.button
                                className="px-5 py-2 bg-[#01a2e9] rounded-2xl w-full"
                                whileTap={{
                                  scale: 0.9,
                                }}
                              >
                                <h1 className="text-white font-semibold">Withdraw</h1>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ComponentTransition >
            </div >
            <div
              className={`absolute  z-[-9] glowbg w-[200px] md:w-[300px] md:h-[300px] left-0 h-[200px] top-[250px]`}
            ></div>
          </div >


        </div >
      </main >

    </>
  );
}