"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styled, { css, keyframes } from "styled-components";
import dynamic from "next/dynamic";
import Orb from "../app/components/Orb";
import Head from "next/head";

const botAvatar = "/robo.svg";
const favicon = "/favicon.ico";
const sendButtonSrc = "/sendbutton.png";

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const twinklingBorder = keyframes`
  0% { border-color: red; }
  50% { border-color: blue; }
  100% { border-color: red; }
`;

const StyledAirplane = styled.button`
  display: none;
`;

const StyledAirplaneContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  border: 1px solid white;
  border-radius: 20px;
  padding: 5px;
  animation: ${twinklingBorder} 5s linear infinite;

  @media (max-width: 600px) {
    padding: 3px;
  }

  .input-field {
    flex: 1;
    padding-right: 30px;
  }
`;

const FileInputWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  flex: 1;
`;

const ChoosePdfButton = styled.label`
  background-color: transparent;
  color: white;
  padding: 10px 16px;
  border: 1px solid white;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  text-align: center;

  &:hover {
    background-color: rgba(121, 82, 179, 0.3);
  }

  @media (max-width: 600px) {
    font-size: 12px;
    padding: 8px 12px;
  }
`;

const FileChosenText = styled.span`
  font-size: 14px;
  color: #d0d0d0;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-left: 10px;

  @media (max-width: 600px) {
    font-size: 12px;
  }
`;

const TextInput = styled.input`
  background-color: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 14px;
  padding: 10px;
  width: 100%;
  flex: 1;
  padding-right: 40px;

  &::placeholder {
    color: #d0d0d0;
  }

  @media (max-width: 600px) {
    font-size: 12px;
    padding: 8px;
  }

  @media (max-width: 600px) {
    font-size: 16px;
  }
`;

const SendButton = styled.button`
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background-color: transparent;
  border: none;
  outline: none;
  cursor: pointer;

  img {
    width: 24px;
    height: 24px;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const StyledPreloaderWrapper = styled.div`
  .loader {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
    height: 200px;
    margin: 130px 0;
    perspective: 780px;
  }

  .text {
    font-size: 20px;
    font-weight: 700;
    color: #cecece;
    z-index: 10;
  }

  .load-inner {
    position: absolute;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: 50%;
  }

  .load-inner.load-one {
    left: 0%;
    top: 0%;
    border-bottom: 3px solid #5c5edc;
    animation: rotate1 1.15s linear infinite;
  }

  .load-inner.load-two {
    right: 0%;
    top: 0%;
    border-right: 3px solid #9147ff;
    animation: rotate2 1.15s 0.1s linear infinite;
  }

  .load-inner.load-three {
    right: 0%;
    bottom: 0%;
    border-top: 3px solid #3b82f6;
    animation: rotate3 1.15s linear infinite;
  }

  @keyframes rotate1 {
    0% {
      transform: rotateX(45deg) rotateY(-45deg) rotateZ(0deg);
    }
    100% {
      transform: rotateX(45deg) rotateY(-45deg) rotateZ(360deg);
    }
  }

  @keyframes rotate2 {
    0% {
      transform: rotateX(45deg) rotateY(45deg) rotateZ(0deg);
    }
    100% {
      transform: rotateX(45deg) rotateY(45deg) rotateZ(360deg);
    }
  }

  @keyframes rotate3 {
    0% {
      transform: rotateX(-60deg) rotateY(0deg) rotateZ(0deg);
    }
    100% {
      transform: rotateX(-60deg) rotateY(0deg) rotateZ(360deg);
    }
  }
`;

const Loader = () => {
  return (
    <StyledPreloaderWrapper>
      <div className='loader'>
        <div className='load-inner load-one' />
        <div className='load-inner load-two' />
        <div className='load-inner load-three' />
        <span className='text'>Loading...</span>
      </div>
    </StyledPreloaderWrapper>
  );
};

const DynamicLoader = dynamic(() => Promise.resolve(Loader), {
  ssr: false,
  loading: () => null,
});

const LandingPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 20px;
  background-color: transparent;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 10px;
  }
`;

const OrbWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  opacity: 0.6;
  z-index: 1;
  transition: opacity 0.3s ease;
`;

const StyledOrbContainer = styled.div`
  position: relative;
  width: 90vh;
  height: 90vh;
  max-width: 750px;
  max-height: 750px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &:hover ${OrbWrapper} {
    opacity: 1;
  }

  @media (max-width: 768px) {
    width: 75vh;
    height: 75vh;
  }

  @media (max-width: 600px) {
    width: 85vw;
    height: 85vw;
    max-width: unset;
    max-height: unset;
  }
`;

const ModeButton = styled.button`
  background-color: #7952b3;
  color: white;
  padding: 14px 28px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 17px;
  margin: 10px;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
  font-weight: 500;
  position: relative;
  z-index: 2;

  &:hover {
    background-color: #5a378e;
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 600px) {
    font-size: 15px;
    padding: 12px 24px;
    margin: 5px;
  }

  ${(props) =>
    props.disabled &&
    css`
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
      &:hover {
        background-color: #7952b3;
        transform: none;
        box-shadow: none;
      }
    `}
`;

const BackButton = styled.button`
  background-color: transparent;
  color: white;
  padding: 6px 10px;
  border: 1px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  margin-top: 10px;
  transition: background-color 0.3s ease;
  position: absolute;
  top: 5px;
  right: 5px;

  &:hover {
    background-color: rgba(121, 82, 179, 0.3);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const WelcomeText = styled.h1`
  font-size: 2.8rem;
  font-weight: bold;
  color: white;
  margin-bottom: 5px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
  position: relative;
  z-index: 2;
  padding: 0 20px;
  max-width: 90%;
  word-break: break-word;

  @media (max-width: 600px) {
    font-size: 2.0rem; /* Further Reduced font size for better fit on small screens */
    padding: 0 10px;
     line-height: 1.2; /* adjust the line height as needed */
  }
`;

const TaglineText = styled.p`
  font-size: 1.2rem;
  color: #d0d0d0;
  margin-bottom: 20px;
  text-align: center;
  padding: 0 20px;
  line-height: 1.5;
  font-family: "Arial", sans-serif;
  position: relative;
  z-index: 2;
  background-color: transparent;
  max-width: 90%;
  word-break: break-word;

  @media (max-width: 600px) {
    font-size: 1rem;
    padding: 0 10px;
  }
`;

const LogoContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;

  @media (max-width: 600px) {
    top: 5px;
    left: 5px;
  }
`;

const LogoImage = styled(Image)`
  width: 75px;
  height: 75px;

  @media (max-width: 600px) {
    width: 50px;
    height: 50px;
  }
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
  margin-top: auto;
  padding-bottom: 10px;

  @media (max-width: 600px) {
    justify-content: center;
    align-items: center;
    padding-bottom: 5px;
  }
`;

const HamburgerButton = styled.button`
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 10;

  &:focus {
    outline: none;
  }

  div {
    width: 2rem;
    height: 0.25rem;
    background: white;
    border-radius: 10px;
    transition: all 0.3s linear;
    position: relative;
    transform-origin: 1px;
  }

  &.open div:first-child {
    transform: rotate(45deg);
  }

  &.open div:nth-child(2) {
    opacity: 0;
    transform: translateX(20px);
  }

  &.open div:nth-child(3) {
    transform: rotate(-45deg);
  }

  @media (max-width: 600px) {
    display: flex;
  }
`;

const CenteredTitle = styled.h1`
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin-left: auto;
  margin-right: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%; /* Adjust for smaller screens */

  @media (max-width: 600px) {
    font-size: 1.5rem; /* Further Reduced font size for better fit on small screens */
    max-width: 90%; /* Further adjust */
     line-height: 1.2; /* Added line-height for wrapping */
  }
`;

const MobileButtonContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  padding-bottom: 20px;
  margin-top: 20px;

  @media (min-width: 601px) {
    display: none;
  }
`;

const DesktopButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 20px;
    position: relative;
    z-index: 2;

    @media (max-width: 600px) {
        display: none;
    }
`;

const BotAvatarImage = styled(Image)`
  width: 32px;
  height: 32px;

  @media (max-width: 600px) {
    width: 24px; /* Reduced size on mobile */
    height: 24px; /* Reduced size on mobile */
  }
`;

function Home() {
  const [mode, setMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const sessionId = useRef(generateSessionId()).current;
  const router = useRouter();
  const [orbHovered, setOrbHovered] = useState(false);

  const handleOrbMouseEnter = () => {
    setOrbHovered(true);
  };

  const handleOrbMouseLeave = () => {
    setOrbHovered(false);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  function generateSessionId() {
    return Math.random().toString(36).substring(2, 15);
  }

  const switchMode = (newMode) => {
    if (loading) return;
    setMode(newMode);
    setMessages([
      {
        text: "Hello! How may I assist you today?",
        sender: "bot",
      },
    ]);
    setInput("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    setMobileMenuOpen(false);
  };

  const goToLandingPage = () => {
    setMode(null);
  };

  const scrollToBottom = useCallback(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [autoScroll]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom =
        Math.abs(
          container.scrollHeight - container.scrollTop - container.clientHeight
        ) < 50;
      setAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0); // Prevent auto-scrolling on route change
    document.title = "AGM ChatBot";
    const timeoutId = setTimeout(() => {
      setAppLoading(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, autoScroll, scrollToBottom]);

  const handleProfileFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please upload only PDF files");
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      setFile(null);
    }
  };

  const handleChatInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a PDF file");
      return;
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      { text: `Uploaded file: ${file?.name || "unknown"}`, sender: "user" },
    ]);
    setLoading(true);
    setAutoScroll(true);

    try {
      const endpoint = "/api/evaluate-profile";
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || response.statusText;
        } catch (jsonError) {
          console.error("Failed to parse error JSON:", jsonError);
          errorMessage = "An unexpected error occurred. Please try again.";
        }
        throw new Error(
          `Server responded with ${response.status}: ${errorMessage}`
        );
      }

      const data = await response.json();

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }

      if (data && data.evaluation) {
        const botMessage = `Evaluation Summary:\n\n${data.evaluation.summary}\n\nVerdict: ${data.evaluation.verdict}\n\nReasoning: ${data.evaluation.reasoning}`;
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botMessage, sender: "bot" },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: "Sorry, there was an error processing your request or the data is missing.",
            sender: "bot",
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: `Sorry, there was an error processing your request: ${error.message}`,
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userMessage = input;

    setMessages((prevMessages) => [
      ...prevMessages,
      { text: userMessage, sender: "user" },
    ]);

    setInput("");
    setLoading(true);
    setAutoScroll(true);

    try {
      const endpoint = "/api/chat";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input, sessionId: sessionId }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: data.response, sender: "bot" },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: `Sorry, there was an error processing your request: ${error.message}`,
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !loading &&
      mode === "text" &&
      input.trim() !== ""
    ) {
      handleSubmit(e);
    }
  };

  const handleProfileKeyDown = (e) => {
    if (e.key === "Enter" && !loading && mode === "profile" && file) {
      handleProfileSubmit(e);
    }
  };

  const handleSendButtonClick = (e) => {
    e.preventDefault();
    if (mode === "text" && input.trim() !== "") {
      handleSubmit(e);
    } else if (mode === "profile" && file) {
      handleProfileSubmit(e);
    }
  };

  const getTitle = () => {
    if (mode === "profile") {
      return "Profile Evaluator";
    } else if (mode === "text") {
      return "Text Generator";
    }
    return "AGM ChatBot";
  };

  const landingPageText = (
    <>
      Your AI-powered assistant for seamless communication and expert profile
      evaluation.
      <br />
      <br />
      🔹 Chat – Engage in intelligent conversations and get instant responses.
      <br />
      🔹 Profile Evaluator – Assess whether a profile is suited to be a Judge
      for Cyber Cypher.
    </>
  );

  return (
    <>
      <Head>
        <link rel='icon' href={favicon} />
        <title>AGM ChatBot</title>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        />
      </Head>
      {appLoading && (
        <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black z-50'>
          <DynamicLoader />
        </div>
      )}
      <div
        className='flex flex-col h-screen text-white'
        style={{ backgroundColor: "transparent" }}>
        {!mode ? (
          <LandingPageWrapper>
            <LogoContainer>
              <LogoImage src={favicon} alt='Logo' width={75} height={75} />
            </LogoContainer>
            <StyledOrbContainer
              onMouseEnter={handleOrbMouseEnter}
              onMouseLeave={handleOrbMouseLeave}>
              <OrbWrapper style={{ opacity: orbHovered ? 1 : 0.6 }}>
                <Orb
                  hoverIntensity={0.5}
                  rotateOnHover={true}
                  hue={350}
                  hue2={230}
                  useTwoHues={true}
                  forceHoverState={orbHovered}
                />
              </OrbWrapper>
              <WelcomeText>Welcome to AGM Chatbot</WelcomeText>
              <TaglineText>{landingPageText}</TaglineText>
            </StyledOrbContainer>

            <DesktopButtonContainer>
              <ModeButton
                onClick={() => switchMode("text")}
                disabled={loading}>
                Chat
              </ModeButton>
              <ModeButton
                onClick={() => switchMode("profile")}
                disabled={loading}>
                Profile Evaluator
              </ModeButton>
            </DesktopButtonContainer>

            <MobileButtonContainer>
              <ModeButton
                onClick={() => switchMode("text")}
                disabled={loading}>
                Chat
              </ModeButton>
              <ModeButton
                onClick={() => switchMode("profile")}
                disabled={loading}>
                Profile Evaluator
              </ModeButton>
            </MobileButtonContainer>
          </LandingPageWrapper>
        ) : (
          <>
            <div className='w-full flex justify-between items-center p-2'>
              <LogoContainer>
                <LogoImage src={favicon} alt='Logo' width={50} height={50} />
              </LogoContainer>
              <CenteredTitle>{getTitle()}</CenteredTitle>
              <HamburgerButton
                onClick={handleMobileMenuToggle}
                className={mobileMenuOpen ? "open" : ""}>
                <div></div>
                <div></div>
                <div></div>
              </HamburgerButton>
            </div>

            <div style={{ position: "relative" }}>
              <BackButton onClick={goToLandingPage}>
                Back to Main Page
              </BackButton>
            </div>

            <div
              className={`mobile-menu ${
                mobileMenuOpen ? "active" : ""
              } fixed top-0 left-0 w-full h-full bg-gray-900 z-10 flex flex-col items-center justify-center gap-8 md:hidden`}
              ref={mobileMenuRef}>
              <button onClick={goToLandingPage} className='mode-button'>
                Main Page
              </button>
              <button
                onClick={() => switchMode("text")}
                className={`mode-button ${mode === "text" ? "active" : ""}`}>
                Chat
              </button>
              <button
                onClick={() => switchMode("profile")}
                className={`mode-button ${mode === "profile" ? "active" : ""}`}>
                Profile Evaluator
              </button>
            </div>

            <div className='container mx-auto p-4 flex flex-col h-full'>
              <div
                className='messages-container flex-1 overflow-y-auto p-4 rounded-3xl bg-black bg-opacity-20'
                ref={messagesContainerRef}
                onScroll={handleScroll}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${
                      message.sender === "user" ? "user" : "bot"
                    }`}>
                    {message.sender === "bot" && (
                      <BotAvatarImage
                        src={botAvatar}
                        alt='Bot Avatar'
                        width={32}
                        height={32}
                        className='bot-avatar'
                      />
                    )}
                    <div className='break-words'>{message.text}</div>
                  </div>
                ))}
                {loading && (
                  <div className='loading'>
                    <div className='loading-content'>
                      <div className='spinner'></div>
                      <span className='text-sm'>
                        {mode === "profile"
                          ? "Evaluating profile..."
                          : "Generating response..."}
                      </span>
                    </div>
                  </div>
                )}
                {messages.find((msg) =>
                  msg.text.includes("Sorry, there was an error")
                ) && (
                  <div className='text-red-500 text-center mt-2'>
                    Sorry, there was an error processing your request. Failed to
                    fetch.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={
                  mode === "profile" ? handleProfileSubmit : handleSubmit
                }
                className='input-form flex items-center mt-4'>
                {mode === "profile" ? (
                  <StyledAirplaneContainer className='input-container flex items-center w-full'>
                    <FileInputWrapper>
                      <ChoosePdfButton htmlFor='profile-file'>
                        Choose PDF
                      </ChoosePdfButton>
                      <HiddenFileInput
                        type='file'
                        id='profile-file'
                        accept='.pdf'
                        onChange={handleProfileFileChange}
                        ref={fileInputRef}
                        onKeyDown={handleProfileKeyDown}
                        autoComplete='off'
                      />
                      <FileChosenText>
                        {file ? file.name : "No file chosen"}
                      </FileChosenText>
                    </FileInputWrapper>
                    <SendButton
                      type='submit'
                      onClick={handleSendButtonClick}
                      disabled={loading}>
                      <Image
                        src={sendButtonSrc}
                        alt='Send'
                        width={24}
                        height={24}
                      />
                    </SendButton>
                  </StyledAirplaneContainer>
                ) : (
                  <StyledAirplaneContainer className='input-container flex items-center w-full'>
                    <FileInputWrapper>
                      <TextInput
                        type='text'
                        id='chat-input'
                        className='input-field flex-1 p-2 text-white'
                        value={input}
                        onChange={handleChatInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder='Type Your Message'
                        autoComplete='off'
                      />
                    </FileInputWrapper>
                    <SendButton
                      type='submit'
                      onClick={handleSendButtonClick}
                      disabled={loading}>
                      <Image
                        src={sendButtonSrc}
                        alt='Send'
                        width={24}
                        height={24}
                      />
                    </SendButton>
                  </StyledAirplaneContainer>
                )}
              </form>

              <div className='footer text-center mt-4'>
                Made with ❤️ by Kaivalya
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Home;