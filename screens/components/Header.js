{/* Header Section */}
      <View style={styles.header}>
        {/* Left Section - Profile + Greeting */}
        <View style={styles.leftSection}>
          <Image
            source={require('../../assets/Profileimg.png')}
            style={styles.profileImage}
          />
          <Text style={styles.greeting}>Hello Victor</Text>
        </View>

        {/* Middle Section - Status Toggle */}
        <TouchableOpacity
          style={[styles.toggleContainer, isOnline && styles.toggleActive]}
          onPress={() => setIsOnline(!isOnline)}
        >
          <View
            style={[
              styles.toggleCircle,
              isOnline ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
            ]}
          >
            <Text style={styles.toggleText}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Section - Notification */}
        <View style={styles.notificationContainer}>
          <Ionicons name="notifications-outline" size={26} color="white" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </View>
      </View>