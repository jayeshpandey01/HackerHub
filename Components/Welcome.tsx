import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
// import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface OnboardingCard {
  id: number;
  iconLibrary: 'FontAwesome5' | 'MaterialIcons' | 'Ionicons';
  iconName: string;
  title: string;
  description: string;
  features: Array<{
    icon: string;
    iconLibrary: 'FontAwesome5' | 'MaterialIcons' | 'Ionicons';
    text: string;
  }>;
  gradient: string[];
  accentColor: string;
}

const onboardingData: OnboardingCard[] = [
  {
    id: 1,
    iconLibrary: 'FontAwesome5',
    iconName: 'robot',
    title: "Meet Your AI Therapist",
    description: "Start conversations anytime, anywhere with your personal AI companion designed to understand and support you",
    gradient: ['#667eea', '#764ba2'],
    accentColor: '#667eea',
    features: [
      {
        icon: 'clock',
        iconLibrary: 'FontAwesome5',
        text: '24/7 availability - Always here when you need support'
      },
      {
        icon: 'user-cog',
        iconLibrary: 'FontAwesome5',
        text: 'Personalized responses tailored to your needs'
      },
      {
        icon: 'shield-alt',
        iconLibrary: 'FontAwesome5',
        text: 'Safe & confidential - Your privacy is protected'
      }
    ]
  },
  {
    id: 2,
    iconLibrary: 'MaterialIcons',
    iconName: 'chat-bubble-outline',
    title: "Express Yourself Freely",
    description: "Share your thoughts, feelings, and concerns in a completely judgment-free and supportive environment",
    gradient: ['#f093fb', '#f5576c'],
    accentColor: '#f093fb',
    features: [
      {
        icon: 'mic',
        iconLibrary: 'FontAwesome5',
        text: 'Voice or text chat - Communicate your way'
      },
      {
        icon: 'mood',
        iconLibrary: 'MaterialIcons',
        text: 'Mood tracking to understand your patterns'
      },
      {
        icon: 'trending-up',
        iconLibrary: 'MaterialIcons',
        text: 'Progress insights to see your growth journey'
      }
    ]
  },
  {
    id: 3,
    iconLibrary: 'Ionicons',
    iconName: 'leaf-outline',
    title: "Grow & Heal Together",
    description: "Receive personalized guidance, coping strategies, and tools designed specifically for your wellness journey",
    gradient: ['#4facfe', '#00f2fe'],
    accentColor: '#4facfe',
    features: [
      {
        icon: 'dumbbell',
        iconLibrary: 'FontAwesome5',
        text: 'Custom exercises designed for your goals'
      },
      {
        icon: 'self-improvement',
        iconLibrary: 'MaterialIcons',
        text: 'Mindfulness tools for daily practice'
      },
      {
        icon: 'target',
        iconLibrary: 'FontAwesome5',
        text: 'Goal setting and achievement tracking'
      }
    ]
  }
];

const WelcomeScreen = ({ onNext }: { onNext?: () => void }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const featureAnims = useRef(
    onboardingData[0].features.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Animate features in sequence
    const animateFeatures = () => {
      const currentFeatures = onboardingData[currentCardIndex].features;
      featureAnims.forEach((anim, index) => {
        if (index < currentFeatures.length) {
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay: index * 200,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }).start();
        }
      });
    };

    animateFeatures();

    // Continuous animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [currentCardIndex]);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderIcon = (iconLibrary: string, iconName: string, size: number, color: string) => {
    const iconProps = { name: iconName as any, size, color };

    switch (iconLibrary) {
      case 'FontAwesome5':
        return <FontAwesome5 {...iconProps} />;
      case 'MaterialIcons':
        return <MaterialIcons {...iconProps} />;
      case 'Ionicons':
        return <Ionicons {...iconProps} />;
      default:
        return <FontAwesome5 {...iconProps} />;
    }
  };

  const nextCard = () => {
    if (currentCardIndex < onboardingData.length - 1) {
      // Reset feature animations
      featureAnims.forEach(anim => anim.setValue(0));

      // Animate card out
      Animated.parallel([
        Animated.timing(cardTranslateX, {
          toValue: -width,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update index and animate new card in
        setCurrentCardIndex(currentCardIndex + 1);
        cardTranslateX.setValue(width);
        cardOpacity.setValue(0);

        Animated.parallel([
          Animated.timing(cardTranslateX, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      onNext && onNext();
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      // Reset feature animations
      featureAnims.forEach(anim => anim.setValue(0));

      // Animate card out
      Animated.parallel([
        Animated.timing(cardTranslateX, {
          toValue: width,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update index and animate new card in
        setCurrentCardIndex(currentCardIndex - 1);
        cardTranslateX.setValue(-width);
        cardOpacity.setValue(0);

        Animated.parallel([
          Animated.timing(cardTranslateX, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const currentCard = onboardingData[currentCardIndex];

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <Animated.View
          style={[
            styles.backgroundCircle1,
            {
              transform: [{ scale: pulseAnim }, { rotate: rotation }],
              backgroundColor: currentCard.gradient[0] + '15'
            }
          ]}
        />
        <Animated.View
          style={[
            styles.backgroundCircle2,
            {
              transform: [{ translateY: floatY }, { rotate: rotation }],
              backgroundColor: currentCard.gradient[1] + '10'
            }
          ]}
        />
        <Animated.View
          style={[
            styles.backgroundCircle3,
            {
              transform: [{ scale: pulseAnim }, { translateY: floatY }],
              backgroundColor: currentCard.accentColor + '08'
            }
          ]}
        />
      </View>

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.brandName}>swap</Text>
        <Text style={styles.tagline}>Swap Your Health</Text>
      </Animated.View>

      {/* Card Container */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateX: cardTranslateX }]
            }
          ]}
        >
          {/* Card Icon */}
          <Animated.View
            style={[
              styles.cardIcon,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatY }],
                backgroundColor: currentCard.accentColor + '20',
                borderColor: currentCard.accentColor + '40'
              }
            ]}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              {renderIcon(currentCard.iconLibrary, currentCard.iconName, 36, currentCard.accentColor)}
            </Animated.View>

            {/* Floating particles around icon */}
            <Animated.View
              style={[
                styles.particle,
                styles.particle1,
                {
                  transform: [{ rotate: rotation }, { translateY: floatY }],
                  backgroundColor: currentCard.accentColor
                }
              ]}
            />
            <Animated.View
              style={[
                styles.particle,
                styles.particle2,
                {
                  transform: [{ rotate: rotation }, { translateY: floatY }],
                  backgroundColor: currentCard.gradient[1]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.particle,
                styles.particle3,
                {
                  transform: [{ rotate: rotation }, { translateY: floatY }],
                  backgroundColor: currentCard.gradient[0]
                }
              ]}
            />
          </Animated.View>

          {/* Card Content */}
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{currentCard.title}</Text>
            <Text style={styles.cardDescription}>{currentCard.description}</Text>

            {/* Features List */}
            <View style={styles.featuresList}>
              {currentCard.features.map((feature, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.featureItem,
                    {
                      opacity: featureAnims[index],
                      transform: [
                        {
                          translateX: featureAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          })
                        },
                        {
                          scale: featureAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <View style={[styles.featureIconContainer, { backgroundColor: currentCard.accentColor + '20' }]}>
                    {renderIcon(feature.iconLibrary, feature.icon, 14, currentCard.accentColor)}
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Navigation Dots */}
        <View style={styles.dotsContainer}>
          {onboardingData.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentCardIndex && [styles.activeDot, { backgroundColor: card.accentColor }]
              ]}
              onPress={() => {
                if (index !== currentCardIndex) {
                  featureAnims.forEach(anim => anim.setValue(0));
                  setCurrentCardIndex(index);
                  cardTranslateX.setValue(0);
                  cardOpacity.setValue(1);
                }
              }}
            />
          ))}
        </View>
      </Animated.View>

      {/* Navigation Controls */}
      <Animated.View
        style={[
          styles.navigationContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.prevButton,
            currentCardIndex === 0 && styles.disabledButton
          ]}
          onPress={prevCard}
          disabled={currentCardIndex === 0}
        >
          <Text style={[
            styles.navButtonText,
            currentCardIndex === 0 && styles.disabledButtonText
          ]}>← Previous</Text>
        </TouchableOpacity>

        {/* Next/Finish Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            { backgroundColor: currentCard.accentColor }
          ]}
          onPress={nextCard}
        >
          <Animated.View
            style={[
              styles.buttonInner,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={styles.nextButtonText}>
              {currentCardIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <View style={styles.buttonIcon}>
              {currentCardIndex === onboardingData.length - 1 ?
                <FontAwesome5 name="rocket" size={16} color="#fff" /> :
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              }
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => {
          // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onNext && onNext();
        }}
      >
        <Text style={styles.skipText}>Skip Tutorial</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    position: "relative",
  },
  backgroundElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundCircle1: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: "rgba(255, 122, 24, 0.08)",
    top: -width * 0.3,
    left: -width * 0.2,
  },
  backgroundCircle2: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: "rgba(255, 174, 52, 0.06)",
    bottom: -width * 0.2,
    right: -width * 0.15,
  },
  backgroundCircle3: {
    position: "absolute",
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: "rgba(255, 122, 24, 0.08)",
    top: height * 0.3,
    left: -width * 0.1,
  },
  header: {
    alignItems: "center",
    paddingTop: height * 0.08,
    paddingBottom: 30,
  },
  brandName: {
    fontSize: 32,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  card: {
    width: width * 0.85,
    maxHeight: height * 0.55,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 122, 24, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 122, 24, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 122, 24, 0.3)",
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  particle1: {
    top: 20,
    right: 15,
  },
  particle2: {
    bottom: 25,
    left: 20,
  },
  particle3: {
    top: 50,
    left: 10,
  },
  cardContent: {
    alignItems: "center",
    width: "100%",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 25,
  },
  cardDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  featuresList: {
    width: "100%",
    alignItems: "flex-start",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  featureIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  featureText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    flex: 1,
    lineHeight: 18,
    fontWeight: "400",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: "#ff7a18",
    width: 28,
    borderRadius: 14,
    shadowColor: "#ff7a18",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: height * 0.04,
    paddingTop: 10,
    width: "100%",
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  prevButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  nextButton: {
    backgroundColor: "rgba(255, 122, 24, 0.9)",
    shadowColor: "#ff7a18",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    minWidth: 140,
  },
  disabledButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  navButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "500",
  },
  disabledButtonText: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  skipButton: {
    position: "absolute",
    top: height * 0.08,
    right: 20,
    padding: 10,
  },
  skipText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "400",
  },
});

export default WelcomeScreen;
