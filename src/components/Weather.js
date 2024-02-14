// src/components/Weather.js

import React, { useState, useEffect } from "react";
import { formatDate } from "../utils/dateUtils";
import locationLogo from "../logos/location-pin-alt-1-svgrepo-com.svg";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";

const Weather = () => {
    const [weatherInfo, setWeatherInfo] = useState();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isPaused, setIsPaused] = useState(false);
    const [isShowed, setIsShowed] = useState(false);
    const [savedWeathers, setSavedWeathers] = useState([]);
    const [showSavedAlert, setShowSavedAlert] = useState(false);
    const [showWeathers, setShowWeathers] = useState(false);

    const fetchWeatherData = async () => {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const positionString = `${latitude},${longitude}`;
            const url = `https://api.weatherapi.com/v1/current.json?key=${process.env.REACT_APP_WEATHER_API_KEY}&q=${positionString}`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                setWeatherInfo(data);
            } catch (err) {
                console.error("Error fetching weather data:", err);
            }
        });
    };

    useEffect(() => {
        fetchWeatherData();
        const weatherTimer = setInterval(() => {
            if (!isPaused) {
                fetchWeatherData();
                setCurrentTime(new Date());
            }
        }, 60000); // every 60 seconds

        return () => clearInterval(weatherTimer);
    }, [isPaused]);

    const togglePause = () => setIsPaused(!isPaused);
    const toggleShowed = () => setIsShowed(!isShowed);

    const ShowButtonOnClick = () => {
        handleShowWeathers();
        toggleShowed();
        if (!isShowed) {
            // After saving, show updated data
            fetchSavedWeatherData();
        }
    };

    const saveCurrentWeather = () => {
        if (weatherInfo) {
            const formattedDate = formatDate(new Date());
            const formattedTime = formatTime(new Date());
            const weatherData = {
                date: `${formattedDate} | Time: ${formattedTime}`,
                temp: weatherInfo.current.temp_c,
                condition: weatherInfo.current.condition.text,
                location: `${weatherInfo.location.name}, ${weatherInfo.location.region}`,
            };

            // setSavedWeathers((prevWeathers) => [
            //     ...prevWeathers.slice(-4),
            //     weatherData,
            // ]);
            saveWeatherToBackend(weatherData);

            setShowSavedAlert(true);
            setTimeout(() => setShowSavedAlert(false), 3000);
        }
    };

    const saveWeatherToBackend = async (weatherData) => {
        try {
            const response = await fetch(
                process.env.REACT_APP_BACKEND_URL + "/save-weather",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(weatherData),
                }
            );
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            console.log(data.message);
            await fetchSavedWeatherData();
        } catch (error) {
            console.error("Failed to save weather data:", error);
        }
    };

    const fetchSavedWeatherData = async () => {
        try {
            const response = await fetch(
                process.env.REACT_APP_BACKEND_URL + `/get-weather`
            );
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            setSavedWeathers(data);
        } catch (error) {
            console.error("Failed to fetch saved weather data:", error);
        }
    };

    const handleShowWeathers = () => {
        setShowWeathers(!showWeathers);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString("en-US", { hour12: false });
    };

    return (
        <>
            <div className="my-3" style={{ margin: "20px" }}>
                <Card className="text-center">
                    <Card.Header as="h5">Current Weather</Card.Header>
                    {weatherInfo ? (
                        <Card.Body>
                            <Card.Title className="mb-4">
                                <img
                                    src={weatherInfo.current.condition.icon}
                                    alt="Weather Icon"
                                    className="weather-icon"
                                />
                            </Card.Title>
                            <Card.Text>
                                <strong>{weatherInfo.current.temp_c}°C</strong>{" "}
                                - {weatherInfo.current.condition.text}
                            </Card.Text>
                            <Card.Text>
                                <img
                                    src={locationLogo}
                                    alt="Location"
                                    className="location-icon me-2"
                                />
                                {weatherInfo.location.name},{" "}
                                {weatherInfo.location.region}
                            </Card.Text>
                            <Card.Text>
                                <small className="text-muted">
                                    Last updated:{" "}
                                    {formatDate(weatherInfo.location.localtime)}{" "}
                                    | Time: {formatTime(currentTime)}
                                </small>
                            </Card.Text>
                        </Card.Body>
                    ) : (
                        <Card.Body>
                            <Card.Text>Loading weather data...</Card.Text>
                        </Card.Body>
                    )}
                </Card>
            </div>
            <div className="d-flex justify-content-center my-3">
                <Button
                    variant={isPaused ? "success" : "danger"}
                    onClick={togglePause}
                >
                    {isPaused ? "Play" : "Pause"}
                </Button>
                <Button
                    variant="secondary"
                    className="mx-3"
                    onClick={saveCurrentWeather}
                >
                    Save Current Weather
                </Button>
                {/* <Button variant="secondary" onClick={handleShowWeathers}>
                    Show Saved Weathers
                </Button> */}
                <Button
                    variant={isShowed ? "dark" : "secondary"}
                    onClick={ShowButtonOnClick}
                >
                    {isShowed ? "Hide Saved Weathers" : " Show Saved Weathers"}
                </Button>
            </div>

            {showSavedAlert && (
                <Alert variant="success" className="text-center">
                    Weather saved successfully!
                </Alert>
            )}

            {showWeathers &&
                savedWeathers.map((reading, index) => (
                    <Card
                        key={index}
                        className="mb-2 "
                        style={{ margin: "20px" }}
                    >
                        <Card.Body>
                            <Card.Text>Date: {reading.date}</Card.Text>
                            <Card.Text>Temperature: {reading.temp}°C</Card.Text>
                            <Card.Text>
                                Condition: {reading.condition}
                            </Card.Text>
                            <Card.Text>Location: {reading.location}</Card.Text>
                        </Card.Body>
                    </Card>
                ))}
        </>
    );
};

export default Weather;
